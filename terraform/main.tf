# main.tf - Adham AgriTech Sovereign Infrastructure

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "adham-agritech-529b0"
  region  = "us-central1"
}

# 1. The Brain: Vertex AI Agent Builder
# Note: Currently managed via Console/API, but defined here for state tracking
resource "google_vertex_ai_agent" "sovereign_core" {
  display_name = "Adham AgriTech Sovereign Agent"
  project      = "adham-agritech-529b0"
  location     = "us-central1"
}

# 2. The Pulse: Eventarc & Pub/Sub
resource "google_pubsub_topic" "agent_wake_up" {
  name = "agent-wake-up-events"
}

resource "google_eventarc_trigger" "satellite_trigger" {
  name     = "on-satellite-image-upload"
  location = "us-central1"
  
  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }
  
  destination {
    cloud_run_service {
      service = "agent-runtime" # Placeholder for actual Cloud Run service
      region  = "us-central1"
    }
  }
}

# 3. The Hands: Cloud Functions (Tools)
resource "google_storage_bucket" "source_code" {
  name     = "adham-agritech-functions-source"
  location = "US"
}

# 4. Data Warehouse: BigQuery
resource "google_bigquery_dataset" "agri_analytics" {
  dataset_id  = "agri_analytics_core"
  description = "Massive geospatial data warehouse"
  location    = "US"
}
