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
