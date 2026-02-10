ALTER TABLE projects
ADD COLUMN event_date DATE DEFAULT NULL;

COMMENT ON COLUMN projects.event_date IS 'The actual date of the event, distinct from the quote submission deadline.';
