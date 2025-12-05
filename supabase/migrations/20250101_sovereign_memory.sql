-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store code embeddings
create table if not exists code_embeddings (
  id bigserial primary key,
  file_path text not null,
  content text not null,
  embedding vector(384), -- 384 dimensions for all-MiniLM-L6-v2
  created_at timestamptz default now(),
  
  -- Add a unique constraint to prevent duplicate chunks for the same file path/content combo
  -- (Optional, but good for idempotency)
  constraint unique_chunk unique(file_path, content)
);

-- Create a function to search for similar code chunks
create or replace function match_code_embeddings (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  file_path text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    code_embeddings.id,
    code_embeddings.file_path,
    code_embeddings.content,
    1 - (code_embeddings.embedding <=> query_embedding) as similarity
  from code_embeddings
  where 1 - (code_embeddings.embedding <=> query_embedding) > match_threshold
  order by code_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
