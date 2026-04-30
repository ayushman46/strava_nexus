create or replace view group_leaderboard_all_time as
select
  gm.group_id,
  p.id as profile_id,
  p.full_name,
  p.avatar_url,
  sum(a.distance_m) as total_distance_m,
  avg(case when a.average_speed > 0 then 1000 / a.average_speed / 60 else null end) as avg_pace,
  count(a.id) as total_runs,
  sum(s.total_points) as total_points
from group_members gm
join profiles p on p.id = gm.profile_id
join activities a on a.profile_id = gm.profile_id
join activity_scores s on s.activity_id = a.id
group by gm.group_id, p.id, p.full_name, p.avatar_url;

create or replace view group_leaderboard_monthly as
select
  gm.group_id,
  p.id as profile_id,
  p.full_name,
  p.avatar_url,
  sum(a.distance_m) as total_distance_m,
  avg(case when a.average_speed > 0 then 1000 / a.average_speed / 60 else null end) as avg_pace,
  count(a.id) as total_runs,
  sum(s.total_points) as total_points
from group_members gm
join profiles p on p.id = gm.profile_id
join activities a on a.profile_id = gm.profile_id
join activity_scores s on s.activity_id = a.id
where a.start_date >= date_trunc('month', now())
group by gm.group_id, p.id, p.full_name, p.avatar_url;

create or replace view group_leaderboard_weekly as
select
  gm.group_id,
  p.id as profile_id,
  p.full_name,
  p.avatar_url,
  sum(a.distance_m) as total_distance_m,
  avg(case when a.average_speed > 0 then 1000 / a.average_speed / 60 else null end) as avg_pace,
  count(a.id) as total_runs,
  sum(s.total_points) as total_points
from group_members gm
join profiles p on p.id = gm.profile_id
join activities a on a.profile_id = gm.profile_id
join activity_scores s on s.activity_id = a.id
where a.start_date >= date_trunc('week', now())
group by gm.group_id, p.id, p.full_name, p.avatar_url;
