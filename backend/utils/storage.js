const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Why this exists:
 * File attachments and avatars used to live on local disk inside the backend
 * container. That breaks the moment you run more than one replica (which the
 * HPA in k8s/hpa.yaml already does, 2-5 pods) — a file saved by the pod that
 * handled the upload simply doesn't exist on the other pods. Object storage
 * fixes that: every pod talks to the same bucket.
 *
 * This uses the AWS SDK v3 S3 client, which speaks the S3 API generically.
 * Pointed at a custom S3_ENDPOINT with S3_FORCE_PATH_STYLE=true, it talks to
 * MinIO (what we run in docker-compose / Minikube). Leave S3_ENDPOINT unset
 * and it talks to real AWS S3 — same code, no changes, just config. That's
 * the whole point of the S3 API being a de facto standard.
 *
 * Two endpoints, on purpose:
 * The backend reaches MinIO over the Docker/K8s internal network (e.g.
 * "http://minio:9000") — that hostname means nothing outside the cluster.
 * A signed URL generated against that endpoint would have "minio:9000" baked
 * into its host, which a citizen's browser can never resolve — the image
 * would just silently fail to load. S3_PUBLIC_ENDPOINT lets signed URLs use
 * a browser-reachable address (e.g. "http://localhost:9000" in docker-compose)
 * while uploads/deletes still go over the fast internal route. In real AWS,
 * S3 is reachable the same way from everywhere, so this isn't needed there —
 * leave it unset and it falls back to S3_ENDPOINT automatically.
 */

const BUCKET = process.env.S3_BUCKET || 'desc-portal-uploads';
const REGION = process.env.S3_REGION || 'ap-south-1';

const credentials =
  process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    : undefined; // unset -> SDK falls back to an IAM role in real AWS

const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

// Used for actual uploads/deletes/bucket checks — the fast internal route.
const s3 = new S3Client({
  region: REGION,
  endpoint: process.env.S3_ENDPOINT || undefined, // unset -> real AWS S3
  forcePathStyle,
  credentials,
});

// Used only to compute signatures for download URLs handed to the browser.
// Falls back to S3_ENDPOINT (then to real AWS S3) if no public endpoint is
// configured, so this is a no-op change for single-endpoint setups.
// Used only to compute signatures for download URLs handed to the browser.
// Resolution order:
//   1. S3_PUBLIC_ENDPOINT, if explicitly set — always wins.
//   2. NODE_IP + S3_PUBLIC_NODE_PORT, auto-constructed — for Minikube/bare
//      k8s with MinIO exposed via NodePort. NODE_IP comes from Kubernetes'
//      Downward API (status.hostIP), which Kubernetes fills in on its own —
//      nobody has to look up `minikube ip` or hand-edit a YAML file, and it
//      can never go stale across redeploys the way a manually-typed IP can.
//   3. Otherwise, falls back to the internal client — correct for
//      single-endpoint setups (docker-compose) and real AWS S3.
function resolvePublicEndpoint() {
  if (process.env.S3_PUBLIC_ENDPOINT) return process.env.S3_PUBLIC_ENDPOINT;
  if (process.env.NODE_IP && process.env.S3_PUBLIC_NODE_PORT) {
    return `http://${process.env.NODE_IP}:${process.env.S3_PUBLIC_NODE_PORT}`;
  }
  return null;
}
const publicEndpoint = resolvePublicEndpoint();
if (process.env.S3_PUBLIC_ENDPOINT) {
  console.log(`✅ Signed URLs will use explicit S3_PUBLIC_ENDPOINT: ${publicEndpoint}`);
} else if (publicEndpoint) {
  console.log(`✅ Signed URLs will use auto-discovered node IP: ${publicEndpoint}`);
} else {
  console.log('ℹ️  No S3_PUBLIC_ENDPOINT or NODE_IP set — signed URLs will use S3_ENDPOINT directly (correct for docker-compose and real AWS S3).');
}

const signingClient = publicEndpoint
  ? new S3Client({
      region: REGION,
      endpoint: publicEndpoint,
      forcePathStyle,
      credentials,
    })
  : s3;

// Buckets are private by design (these documents can contain CNIC numbers
// and other sensitive citizen data) — files are only ever reachable through
// short-lived signed URLs generated on read, never a permanent public link.
async function ensureBucketExists(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
      console.log(`✅ S3 bucket "${BUCKET}" reachable`);
      return;
    } catch (err) {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
        console.log(`✅ Created S3 bucket "${BUCKET}"`);
        return;
      } catch (createErr) {
        // MinIO/the storage container often isn't accepting connections yet
        // by the time the backend finishes booting — this isn't a real
        // failure, just a startup race, so retry with backoff before
        // actually giving up.
        if (attempt === retries) {
          console.error(`⚠️  Could not verify or create bucket "${BUCKET}" after ${retries} attempts:`, createErr.message);
          console.error('   File uploads will fail until this is resolved.');
          return;
        }
        console.log(`Storage not ready yet (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}

async function uploadBuffer({ buffer, key, contentType }) {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType })
  );
  return key;
}

async function deleteObject(key) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('Failed to delete S3 object:', key, err.message);
  }
}

// Old local-disk attachments (pre-migration) were stored as "/uploads/..."
// paths, not S3 keys. Anything matching that shape gets passed through
// unsigned so existing data doesn't break — new uploads always get a key.
function isLegacyLocalPath(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

async function getSignedDownloadUrl(key, expiresInSeconds = 3600) {
  if (!key) return null;
  if (isLegacyLocalPath(key)) return key;
  try {
    return await getSignedUrl(signingClient, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  } catch (err) {
    console.error('Failed to sign URL for', key, err.message);
    return null;
  }
}

// Attach a temporary, signed `url` to each attachment on a request, without
// touching what's actually persisted in MongoDB (which stays just the key).
async function withAttachmentUrls(request) {
  if (!request) return request;
  const obj = typeof request.toObject === 'function' ? request.toObject() : { ...request };
  if (Array.isArray(obj.attachments) && obj.attachments.length) {
    obj.attachments = await Promise.all(
      obj.attachments.map(async (a) => ({ ...a, url: await getSignedDownloadUrl(a.key) }))
    );
  }
  return obj;
}

async function withAttachmentUrlsMany(requests) {
  return Promise.all((requests || []).map(withAttachmentUrls));
}

// Same idea for a user's avatar — `avatar` keeps being the field the
// frontend already reads, it's just a signed URL instead of a raw key by
// the time it reaches the client.
async function withAvatarUrl(user) {
  if (!user) return user;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  if (obj.avatar) obj.avatar = await getSignedDownloadUrl(obj.avatar);
  return obj;
}

async function withAvatarUrlMany(users) {
  return Promise.all((users || []).map(withAvatarUrl));
}

module.exports = {
  BUCKET,
  ensureBucketExists,
  uploadBuffer,
  deleteObject,
  getSignedDownloadUrl,
  withAttachmentUrls,
  withAttachmentUrlsMany,
  withAvatarUrl,
  withAvatarUrlMany,
};
