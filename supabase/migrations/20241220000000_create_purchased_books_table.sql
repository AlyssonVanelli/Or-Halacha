-- Create purchased_books table
CREATE TABLE purchased_books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID NOT NULL,
  division_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, division_id)
);

-- Enable RLS
ALTER TABLE purchased_books ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchased books" ON purchased_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased books" ON purchased_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchased books" ON purchased_books
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX purchased_books_user_id_idx ON purchased_books (user_id);
CREATE INDEX purchased_books_division_id_idx ON purchased_books (division_id);
CREATE INDEX purchased_books_expires_at_idx ON purchased_books (expires_at);

