variable "namespace" {
  description = "Kubernetes namespace for DESC Portal"
  type        = string
  default     = "desc-portal"
}

variable "backend_image" {
  description = "Docker image for backend"
  type        = string
  default     = "tauseefmushtaq/desc-backend:latest"
}

variable "frontend_image" {
  description = "Docker image for frontend"
  type        = string
  default     = "tauseefmushtaq/desc-frontend:latest"
}

variable "mongodb_image" {
  description = "Docker image for MongoDB"
  type        = string
  default     = "mongo:latest"
}

variable "backend_replicas" {
  description = "Number of backend replicas"
  type        = number
  default     = 2
}

variable "frontend_replicas" {
  description = "Number of frontend replicas"
  type        = number
  default     = 2
}

variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  default     = "mongodb://mongodb:27017/desc_portal"
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  default     = "dEsC@P0rtal#Secure!Key$2026&MRD"
  sensitive   = true
}

variable "jwt_expire" {
  description = "JWT expiration time"
  type        = string
  default     = "7d"
}

variable "node_env" {
  description = "Node environment"
  type        = string
  default     = "production"
}

variable "client_url" {
  description = "Client URL"
  type        = string
  default     = "http://desc-portal.local"
}

variable "storage_size" {
  description = "MongoDB persistent storage size"
  type        = string
  default     = "1Gi"
}

variable "redis_image" {
  description = "Docker image for Redis (backs the Socket.IO adapter for real-time notifications)"
  type        = string
  default     = "redis:7-alpine"
}

variable "minio_image" {
  description = "Docker image for MinIO (S3-compatible object storage for attachments/avatars)"
  type        = string
  default     = "minio/minio:latest"
}

variable "minio_storage_size" {
  description = "MinIO persistent storage size"
  type        = string
  default     = "5Gi"
}

variable "s3_bucket" {
  description = "S3/MinIO bucket name for request attachments and avatars"
  type        = string
  default     = "desc-portal-uploads"
}

variable "s3_region" {
  description = "S3 region (MinIO ignores the actual value, but the AWS SDK requires one to be set)"
  type        = string
  default     = "ap-south-1"
}

variable "minio_root_user" {
  description = "MinIO root user / S3 access key"
  type        = string
  default     = "minioadmin"
  sensitive   = true
}

variable "minio_root_password" {
  description = "MinIO root password / S3 secret key"
  type        = string
  default     = "minioadmin123"
  sensitive   = true
}

variable "minikube_ip" {
  description = <<-EOT
    Output of `minikube ip`, only needed when deploying to Minikube.
    MinIO's API is only reachable from outside the cluster via the NodePort
    in k8s/minio/service.yaml (30900) — a browser fetching a signed avatar
    or attachment URL runs outside the cluster, so it needs this to resolve
    anything. Leave as the default empty string for a real cloud deployment
    against actual AWS S3, where this isn't a concern at all.
  EOT
  type        = string
  default     = ""
}
