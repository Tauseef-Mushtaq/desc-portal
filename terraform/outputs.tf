output "namespace" {
  description = "Kubernetes namespace"
  value       = kubernetes_namespace.desc_portal.metadata[0].name
}

output "backend_replicas" {
  description = "Number of backend replicas"
  value       = kubernetes_deployment.backend.spec[0].replicas
}

output "frontend_replicas" {
  description = "Number of frontend replicas"
  value       = kubernetes_deployment.frontend.spec[0].replicas
}

output "backend_image" {
  description = "Backend Docker image"
  value       = var.backend_image
}

output "frontend_image" {
  description = "Frontend Docker image"
  value       = var.frontend_image
}

output "mongodb_service" {
  description = "MongoDB service name"
  value       = kubernetes_service.mongodb.metadata[0].name
}

output "backend_service" {
  description = "Backend service name"
  value       = kubernetes_service.backend.metadata[0].name
}

output "frontend_service" {
  description = "Frontend service name"
  value       = kubernetes_service.frontend.metadata[0].name
}

output "hpa_min_replicas" {
  description = "HPA minimum replicas"
  value       = kubernetes_horizontal_pod_autoscaler_v2.backend_hpa.spec[0].min_replicas
}

output "hpa_max_replicas" {
  description = "HPA maximum replicas"
  value       = kubernetes_horizontal_pod_autoscaler_v2.backend_hpa.spec[0].max_replicas
}

output "deployment_summary" {
  description = "Full deployment summary"
  value = <<-EOT
    ===================================
    DESC Portal Deployment Summary
    ===================================
    Namespace     : ${kubernetes_namespace.desc_portal.metadata[0].name}
    Backend       : ${var.backend_image} (${kubernetes_deployment.backend.spec[0].replicas} replicas)
    Frontend      : ${var.frontend_image} (${kubernetes_deployment.frontend.spec[0].replicas} replicas)
    MongoDB       : ${var.mongodb_image} (1 replica)
    HPA           : ${kubernetes_horizontal_pod_autoscaler_v2.backend_hpa.spec[0].min_replicas}-${kubernetes_horizontal_pod_autoscaler_v2.backend_hpa.spec[0].max_replicas} replicas at 50% CPU
    Storage       : ${var.storage_size} PVC for MongoDB
    ===================================
  EOT
}
