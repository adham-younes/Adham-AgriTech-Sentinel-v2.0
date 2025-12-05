-- Enable required extensions
create extension if not exists vector;

-- Nodes table (files, functions, classes, db tables)
create table if not exists knowledge_nodes (
  id bigint primary key generated always as identity,
  name text not null,
  type text not null,               -- 'file' | 'function' | 'class' | 'db_table'
  content text,                    -- full source code or definition
  embedding vector(384),            -- semantic embedding
  metadata jsonb default '{}'       -- extra info (path, line numbers, etc.)
);

-- Edges table (relationships between nodes)
create table if not exists knowledge_edges (
  source_id bigint references knowledge_nodes(id),
  target_id bigint references knowledge_nodes(id),
  relationship text not null,       -- e.g. 'imports', 'calls', 'defines', 'modifies'
  primary key (source_id, target_id, relationship)
);

-- Index for fast vector similarity search
create index on knowledge_nodes using ivfflat (embedding vector_cosine_ops);

-- RPC function for similarity search
create or replace function match_knowledge_nodes(
    query_embedding vector(384),
    match_threshold float
) returns setof knowledge_nodes
language sql stable
as $$
    select *
    from knowledge_nodes
    where 1 - (embedding <=> query_embedding) >= match_threshold
    order by 1 - (embedding <=> query_embedding) desc
    limit 10;
$$;
