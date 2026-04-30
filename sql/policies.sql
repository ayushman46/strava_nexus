alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table activities enable row level security;
alter table activity_scores enable row level security;
alter table ai_coach_reports enable row level security;

create policy "Profiles are readable by members" on profiles
  for select using (true);

create policy "Profiles writable by owner" on profiles
  for update using (auth.uid() = id);

create policy "Groups readable by members" on groups
  for select using (
    exists (
      select 1 from group_members gm
      where gm.group_id = groups.id and gm.profile_id = auth.uid()
    )
  );

create policy "Group members readable" on group_members
  for select using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id and gm.profile_id = auth.uid()
    )
  );

create policy "Activities readable by owner" on activities
  for select using (profile_id = auth.uid());

create policy "Activity scores readable by owner" on activity_scores
  for select using (
    exists (
      select 1 from activities a where a.id = activity_scores.activity_id and a.profile_id = auth.uid()
    )
  );

create policy "AI reports readable by owner" on ai_coach_reports
  for select using (profile_id = auth.uid());
