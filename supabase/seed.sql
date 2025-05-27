-- Insert admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  'admin'
);

-- Insert sample chapters
INSERT INTO chapters (title, slug, content, position) VALUES
(
  'Introdução à Halacha',
  'introducao-a-halacha',
  'A Halacha (הלכה) é o corpo de leis e práticas judaicas que regem a vida diária dos judeus. Ela é baseada na Torá escrita e na Torá oral, e foi desenvolvida ao longo dos séculos pelos sábios judeus.',
  1
),
(
  'Shabat',
  'shabat',
  'O Shabat é o dia sagrado semanal no judaísmo, que começa ao pôr do sol na sexta-feira e termina ao pôr do sol no sábado. Durante este período, os judeus observantes abstêm-se de certas atividades criativas, conhecidas como melachot.',
  2
),
(
  'Kashrut',
  'kashrut',
  'Kashrut (כשרות) refere-se às leis dietéticas judaicas. Estas leis determinam quais alimentos são permitidos (kosher) e quais são proibidos (treif) para os judeus observantes.',
  3
);

-- Insert sample comments
INSERT INTO comments (user_id, chapter_id, content) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM chapters WHERE slug = 'introducao-a-halacha'),
  'Excelente introdução ao tema!'
);

-- Insert sample likes
INSERT INTO likes (user_id, chapter_id) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM chapters WHERE slug = 'shabat')
);

-- Insert sample bookmarks
INSERT INTO bookmarks (user_id, chapter_id) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM chapters WHERE slug = 'kashrut')
); 