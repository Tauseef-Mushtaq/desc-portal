# ─── NAMESPACE ────────────────────────────────────────────────────────────────
resource "kubernetes_namespace" "desc_portal" {
  metadata {
    name = var.namespace
  }
}

# ─── BACKEND SECRET ───────────────────────────────────────────────────────────
resource "kubernetes_secret" "backend_secret" {
  metadata {
    name      = "backend-secret"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  type = "Opaque"

  data = {
    MONGODB_URI = "bW9uZ29kYjovL21vbmdvZGI6MjcwMTcvZGVzY19wb3J0YWw="
    JWT_SECRET  = "ZGVzY19wb3J0YWxfc3VwZXJfc2VjcmV0X2p3dF9rZXlfMjAyNA=="
    JWT_EXPIRE  = "N2Q="
    NODE_ENV    = "ZGV2ZWxvcG1lbnQ="
    CLIENT_URL  = "aHR0cDovL2xvY2FsaG9zdDozMDAw"
    PORT        = "NTAwMA=="
  }
}

# ─── MONGODB PVC ──────────────────────────────────────────────────────────────
resource "kubernetes_persistent_volume_claim" "mongodb_pvc" {
  metadata {
    name      = "mongodb-pvc"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = var.storage_size
      }
    }
  }
}

# ─── MONGODB DEPLOYMENT ───────────────────────────────────────────────────────
resource "kubernetes_deployment" "mongodb" {
  metadata {
    name      = "mongodb"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "mongodb"
      }
    }

    template {
      metadata {
        labels = {
          app = "mongodb"
        }
      }

      spec {
        container {
          name              = "mongodb"
          image             = var.mongodb_image
          image_pull_policy = "Always"

          port {
            container_port = 27017
          }

          volume_mount {
            name       = "mongodb-storage"
            mount_path = "/data/db"
          }
        }

        volume {
          name = "mongodb-storage"

          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.mongodb_pvc.metadata[0].name
          }
        }
      }
    }
  }
}

# ─── MONGODB SERVICE ──────────────────────────────────────────────────────────
resource "kubernetes_service" "mongodb" {
  metadata {
    name      = "mongodb"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    selector = {
      app = "mongodb"
    }

    port {
      port        = 27017
      target_port = 27017
    }

    type = "ClusterIP"
  }
}

# ─── REDIS DEPLOYMENT ─────────────────────────────────────────────────────────
# Backs the Socket.IO adapter so real-time notifications fan out correctly
# across every backend replica, not just whichever pod a socket happens to
# be connected to (see backend/utils/socket.js).
resource "kubernetes_deployment" "redis" {
  metadata {
    name      = "redis"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "redis"
      }
    }

    template {
      metadata {
        labels = {
          app = "redis"
        }
      }

      spec {
        container {
          name  = "redis"
          image = var.redis_image

          port {
            container_port = 6379
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}

# ─── REDIS SERVICE ────────────────────────────────────────────────────────────
resource "kubernetes_service" "redis" {
  metadata {
    name      = "redis"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    selector = {
      app = "redis"
    }

    port {
      port        = 6379
      target_port = 6379
    }

    type = "ClusterIP"
  }
}

# ─── MINIO SECRET ──────────────────────────────────────────────────────────────
# Same credentials exposed under two sets of env var names: MINIO_ROOT_* for
# the MinIO container itself, S3_* for the backend's AWS SDK client.
resource "kubernetes_secret" "minio_secret" {
  metadata {
    name      = "minio-secret"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  type = "Opaque"

  data = {
    MINIO_ROOT_USER       = base64encode(var.minio_root_user)
    MINIO_ROOT_PASSWORD   = base64encode(var.minio_root_password)
    S3_ACCESS_KEY_ID      = base64encode(var.minio_root_user)
    S3_SECRET_ACCESS_KEY  = base64encode(var.minio_root_password)
  }
}

# ─── MINIO PVC ─────────────────────────────────────────────────────────────────
resource "kubernetes_persistent_volume_claim" "minio_pvc" {
  metadata {
    name      = "minio-pvc"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = var.minio_storage_size
      }
    }
  }
}

# ─── MINIO DEPLOYMENT ──────────────────────────────────────────────────────────
# S3-compatible object storage for request attachments and avatars. Local
# disk doesn't survive across backend replicas, so files live here instead —
# and because this speaks the standard S3 API, the exact same backend code
# would work unchanged against real AWS S3 in a cloud deployment, just by
# changing S3_ENDPOINT (see backend/utils/storage.js).
resource "kubernetes_deployment" "minio" {
  metadata {
    name      = "minio"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "minio"
      }
    }

    template {
      metadata {
        labels = {
          app = "minio"
        }
      }

      spec {
        container {
          name              = "minio"
          image             = var.minio_image
          image_pull_policy = "Always"
          args              = ["server", "/data", "--console-address", ":9001"]

          port {
            container_port = 9000
          }
          port {
            container_port = 9001
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.minio_secret.metadata[0].name
            }
          }

          volume_mount {
            name       = "minio-storage"
            mount_path = "/data"
          }

          readiness_probe {
            http_get {
              path = "/minio/health/ready"
              port = 9000
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }

          liveness_probe {
            http_get {
              path = "/minio/health/live"
              port = 9000
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }

        volume {
          name = "minio-storage"

          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.minio_pvc.metadata[0].name
          }
        }
      }
    }
  }
}

# ─── MINIO SERVICE ─────────────────────────────────────────────────────────────
resource "kubernetes_service" "minio" {
  metadata {
    name      = "minio"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    selector = {
      app = "minio"
    }

    port {
      name        = "api"
      port        = 9000
      target_port = 9000
    }
    port {
      name        = "console"
      port        = 9001
      target_port = 9001
    }

    type = "ClusterIP"
  }
}

# ─── BACKEND DEPLOYMENT ───────────────────────────────────────────────────────
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    replicas = var.backend_replicas

    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "backend"
        }
      }

      spec {
        container {
          name              = "backend"
          image             = var.backend_image
          image_pull_policy = "Always"

          port {
            container_port = 5000
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.backend_secret.metadata[0].name
            }
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.minio_secret.metadata[0].name # provides S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
            }
          }

          env {
            name  = "REDIS_URL"
            value = "redis://${kubernetes_service.redis.metadata[0].name}:6379"
          }
          env {
            name  = "S3_ENDPOINT"
            value = "http://${kubernetes_service.minio.metadata[0].name}:9000"
          }
          env {
            name  = "S3_BUCKET"
            value = var.s3_bucket
          }
          env {
            name  = "S3_REGION"
            value = var.s3_region
          }
          env {
            name  = "S3_FORCE_PATH_STYLE"
            value = "true"
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 5000
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 5000
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }
  }
}

# ─── BACKEND SERVICE ──────────────────────────────────────────────────────────
resource "kubernetes_service" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    selector = {
      app = "backend"
    }

    port {
      port        = 5000
      target_port = 5000
    }

    type = "ClusterIP"
  }
}

# ─── FRONTEND DEPLOYMENT ──────────────────────────────────────────────────────
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    replicas = var.frontend_replicas

    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "frontend"
        }
      }

      spec {
        container {
          name              = "frontend"
          image             = var.frontend_image
          image_pull_policy = "Always"

          port {
            container_port = 80
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}

# ─── FRONTEND SERVICE ─────────────────────────────────────────────────────────
resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    selector = {
      app = "frontend"
    }

    port {
      port        = 80
      target_port = 80
    }

    type = "ClusterIP"
  }
}

# ─── HORIZONTAL POD AUTOSCALER ────────────────────────────────────────────────
resource "kubernetes_horizontal_pod_autoscaler_v2" "backend_hpa" {
  metadata {
    name      = "backend-hpa"
    namespace = kubernetes_namespace.desc_portal.metadata[0].name
  }

  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.backend.metadata[0].name
    }

    min_replicas = 2
    max_replicas = 5

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 50
        }
      }
    }
  }
}
