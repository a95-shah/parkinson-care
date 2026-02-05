-- Create AI insights table
create table public.ai_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  insight_type text not null check (insight_type in ('daily', 'weekly', 'monthly', 'quarterly')),
  date_range_start date not null,
  date_range_end date not null,
  summary text not null,
  key_observations jsonb not null,
  medication_patterns text,
  symptom_trends text,
  wearing_off_patterns text,
  recommendations text,
  data_points_analyzed integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.ai_insights enable row level security;

-- Create policies
create policy "Users can view their own insights"
  on public.ai_insights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own insights"
  on public.ai_insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own insights"
  on public.ai_insights for update
  using (auth.uid() = user_id);

create policy "Users can delete their own insights"
  on public.ai_insights for delete
  using (auth.uid() = user_id);

-- Create trigger for updated_at
create trigger on_ai_insights_updated
  before update on public.ai_insights
  for each row
  execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index ai_insights_user_id_idx on public.ai_insights(user_id);
create index ai_insights_created_at_idx on public.ai_insights(created_at desc);
create index ai_insights_date_range_idx on public.ai_insights(date_range_start, date_range_end);
