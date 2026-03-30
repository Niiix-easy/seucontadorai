
DELETE FROM clients
WHERE id NOT IN (
  SELECT id FROM clients ORDER BY created_at LIMIT 10
);
