---
visibility: public
---

# VectorDB Engine

## Overview

VectorDB Engine is a custom vector database and local RAG pipeline implemented in Python.

The project focuses on understanding vector search, approximate nearest-neighbor indexing, embeddings, retrieval, and RAG without relying on a managed vector database service.

## Project Information

- **Language:** Python
- **API Framework:** FastAPI
- **Vector Mathematics:** NumPy
- **Embedding / Local Inference:** Ollama
- **Indexing:** Custom HNSW
- **Containerization:** Docker
- **RAG:** Local retrieval-augmented generation

## Core Features

- Semantic vector search
- Cosine similarity
- Custom HNSW indexing
- Hybrid search
- Local RAG
- Local inference through Ollama
- Docker-based deployment

## Architecture

### API Layer

FastAPI and Uvicorn expose the vector search and RAG functionality through REST endpoints.

### Vector Processing

NumPy is used for operations involving the embedding vectors.

### Embeddings

The `all-minilm` model is used through Ollama to convert text into 384-dimensional vectors.

### Generative Model

The `tinydolphin` model is used through Ollama for answer generation in the RAG pipeline.

### Indexing

A custom HNSW implementation in Python is used for approximate nearest-neighbor search.

### Deployment

The application is containerized with Docker and communicates with the host-level Ollama process through `host.docker.internal`.

## Data Flow

### Phase 1 — Data Ingestion

1. `bulk_import.py` reads the source data.
2. Source content is divided into chunks.
3. Ollama generates 384-dimensional embeddings for the chunks.
4. The vectors are inserted into the custom HNSW index.

### Phase 2 — Query Processing

1. The user's question is converted into a 384-dimensional query vector.
2. HNSW searches the graph for approximate nearest-neighbor candidates.
3. Candidate results are refined using cosine similarity.
4. Hybrid keyword scoring can be used to improve exact-name or identifier matching.
5. The retrieved context is added to the RAG prompt.
6. The local LLM generates the final response.

## Cosine Similarity

Cosine similarity measures the angular similarity between vectors.

It is used to compare the query vector with stored document vectors.

## HNSW

HNSW (Hierarchical Navigable Small World) is a graph-based approximate nearest-neighbor indexing method.

The custom implementation organizes vectors across multiple graph layers.

Upper layers provide sparse navigation paths, while lower layers contain denser connections.

Search proceeds from an upper-level entry point toward lower layers to identify candidate neighbors.

## Custom HNSW Implementation

The HNSW implementation was built from scratch rather than using an external HNSW library.

The implementation includes:

- Layer assignment
- Graph connections
- Neighbor selection
- Hierarchical navigation
- Approximate nearest-neighbor search

Only implementation details explicitly documented in this project should be treated as verified claims about Kusal's implementation.

## Hybrid Search

The retrieval pipeline can combine vector similarity with exact-match keyword scoring.

This is useful when exact identifiers, names, or terms should receive additional relevance.

## RAG Pipeline

The RAG workflow retrieves relevant chunks before passing them to the local language model.

The retrieved information is then included as context for answer generation.

## Privacy

The inference pipeline runs locally using Ollama rather than sending the retrieved data to an external managed vector database service.

## Key Engineering Decisions

### Why Build HNSW From Scratch?

Building the index from scratch provided an opportunity to understand the underlying mechanics of approximate nearest-neighbor indexing instead of relying entirely on a pre-built HNSW library.

### Why Ollama?

Ollama allows the embedding and generation components to run locally.

### Why Docker?

Docker provides a consistent environment for running the API and vector-search components.

### Why Hybrid Search?

Semantic similarity is useful for conceptual matching, while exact keyword matching can help prioritize specific identifiers and names.

## Performance

The project documentation reports sub-10 ms query latency for the custom HNSW search.

This figure should only be interpreted within the benchmark conditions under which it was measured.
