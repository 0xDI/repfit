-- Delete sessions created with invalid dates (e.g. 1970)
DELETE FROM public.gym_sessions WHERE session_date < '2025-01-01';
