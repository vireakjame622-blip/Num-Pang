-- ========================================================
-- NUM PANG (នំបុ័ង) - SEED DATA (10 Authentic Dishes)
-- ========================================================

-- Create Mock User Profiles (Using static UUIDs for seed demo)
-- Note: When running in production with real Supabase Auth, profiles are auto-created by auth trigger.
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sokha_khmerfood', 'Sokha Chea', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', 'Cambodian foodie on a mission to map every street stall in Phnom Penh.'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'dara_streetbites', 'Dara Sam', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', 'Siem Reap local & Tuk Tuk food tour guide. Ask me for hidden gems!'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'bopha_nom', 'Bopha Vorn', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', 'Passionate about traditional Khmer desserts and fresh iced drinks.')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

-- 10 Cambodian Dishes Seed Data
INSERT INTO public.posts (
  id, user_id, dish_name, category, price_usd, price_khr, caption, image_url, location_name, latitude, longitude, created_at
)
VALUES
  -- 1. Num Pang Pâté (Phnom Penh - Central Market)
  (
    '11111111-1111-1111-1111-111111111111',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Num Pang Sach Pâté (នំបុ័ងប៉ាតេ)',
    'snacks',
    1.50,
    6000,
    'Crispy warm baguette loaded with rich liver pâté, pickled daikon & carrots, fresh cucumber, and spicy chili sauce! Best breakfast snack right outside Phsar Thmey.',
    'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=1080&q=80',
    'Central Market (Phsar Thmey), Phnom Penh',
    11.5694,
    104.9211,
    NOW() - INTERVAL '1 hour'
  ),

  -- 2. Kuy Teav Phnom Penh (Phnom Penh - Orussey Market)
  (
    '22222222-2222-2222-2222-222222222222',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Kuy Teav Phnom Penh (គុយទាវភ្នំពេញ)',
    'noodles',
    2.75,
    11000,
    'Fragrant pork bone broth simmered for 8 hours with dried squid. Topped with minced pork, sliced heart, crispy garlic, cilantro, and fresh lime. The ultimate morning comfort.',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1080&q=80',
    'Orussey Market Stall #42, Phnom Penh',
    11.5613,
    104.9157,
    NOW() - INTERVAL '3 hours'
  ),

  -- 3. Bai Sach Chrouk (Phnom Penh - Russian Market)
  (
    '33333333-3333-3333-3333-333333333333',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Bai Sach Chrouk (បាយសាច់ជ្រូក)',
    'rice',
    1.25,
    5000,
    'Charcoal-marinated pork with coconut milk and garlic over broken jasmine rice. Served with pickled cucumbers and radish, scallion oil, and a small bowl of chicken broth.',
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1080&q=80',
    'Russian Market (Toul Tom Poung), Phnom Penh',
    11.5362,
    104.9150,
    NOW() - INTERVAL '6 hours'
  ),

  -- 4. Traditional Fish Amok (Siem Reap - Old Market)
  (
    '44444444-4444-4444-4444-444444444444',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Royal Fish Amok (អាម៉ុកត្រី)',
    'rice',
    4.50,
    18000,
    'Steamed snakehead fish in banana leaf cup with golden kroeung lemongrass paste, rich coconut cream, and fresh slok ngor herbs. Melts in your mouth like silk!',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1080&q=80',
    'Phsar Chas (Old Market), Siem Reap',
    13.3549,
    103.8553,
    NOW() - INTERVAL '12 hours'
  ),

  -- 5. Lort Cha with Beef & Duck Egg (Phnom Penh - Riverside)
  (
    '55555555-5555-5555-5555-555555555555',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Lort Cha Poang Tea (ឡូតឆាពងទា)',
    'noodles',
    1.75,
    7000,
    'Wok-tossed silver needle noodles with beef, chives, bean sprouts, and sweet dark fish sauce, topped with a runny fried duck egg. Street food perfection after sunset.',
    'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1080&q=80',
    'Riverside Night Stalls, Sisowath Quay, Phnom Penh',
    11.5710,
    104.9304,
    NOW() - INTERVAL '1 day'
  ),

  -- 6. Nom Banh Chok Samlor Khmer (Battambang)
  (
    '66666666-6666-6666-6666-666666666666',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Nom Banh Chok (នំបញ្ចុកសម្លខ្មែរ)',
    'noodles',
    1.00,
    4000,
    'Fresh fermented rice vermicelli noodles doused in green lemongrass and river fish curry broth. Piled high with water lily stems, cucumber, banana flower, and long beans.',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1080&q=80',
    'Battambang Riverside Market, Battambang',
    13.0957,
    103.2022,
    NOW() - INTERVAL '1 day 4 hours'
  ),

  -- 7. Bok Lahong Khmer Papaya Salad (Phnom Penh - BKK1)
  (
    '77777777-7777-7777-7777-777777777777',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Bok Lahong Phtaok (បុកល្ហុងក្តាមប្រៃ)',
    'snacks',
    2.00,
    8000,
    'Extra spicy green papaya salad pounded with salted field crabs, fermented fish sauce (prahok), cherry tomatoes, lime, and crushed peanuts. Bring your tissues!',
    'https://images.unsplash.com/photo-1505253758473-96b3d5ebca49?auto=format&fit=crop&w=1080&q=80',
    'Street 288 & 51 Corner, BKK1, Phnom Penh',
    11.5518,
    104.9262,
    NOW() - INTERVAL '1 day 8 hours'
  ),

  -- 8. Num Krok Coconut Rice Cakes (Siem Reap - Wat Bo)
  (
    '88888888-8888-8888-8888-888888888888',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Num Krok (នំគ្រក់)',
    'dessert',
    1.00,
    4000,
    'Crispy outside, creamy molten coconut center inside! Made in a traditional cast-iron dimpled pan with scallions, dipped in sweet fish sauce with garlic.',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1080&q=80',
    'Wat Bo Village Road, Siem Reap',
    13.3592,
    103.8647,
    NOW() - INTERVAL '2 days'
  ),

  -- 9. Cha Houy Teuk Shaved Ice (Phnom Penh - Toul Kork)
  (
    '99999999-9999-9999-9999-999999999999',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Cha Houy Teuk (ឆាហួយទឹក)',
    'dessert',
    0.75,
    3000,
    'Sweet refreshing dessert cup with agar-agar jelly, red beans, tapioca pearls, coconut cream, and shaved ice. Perfect cure for hot tropical afternoons!',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1080&q=80',
    'Street 315, Toul Kork, Phnom Penh',
    11.5732,
    104.8964,
    NOW() - INTERVAL '2 days 5 hours'
  ),

  -- 10. Cold Sugarcane Juice with Calamansi (Kampot)
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Teuk Ampov Sros (ទឹកអំពៅច្របាច់ក្រូចឆ្មា)',
    'drinks',
    0.50,
    2000,
    'Freshly pressed sugarcane juice pressed with sweet calamansi citrus over crushed ice. Incredibly crisp and natural sweetness by the Kampot river.',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1080&q=80',
    'Kampot Old Market Riverfront, Kampot',
    10.6095,
    104.1802,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Likes Seed
INSERT INTO public.likes (post_id, user_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('11111111-1111-1111-1111-111111111111', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
  ('22222222-2222-2222-2222-222222222222', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
  ('33333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;

-- Comments Seed
INSERT INTO public.comments (post_id, user_id, content)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'My favorite Num Pang vendor in all of Phnom Penh! Add extra pickles!'),
  ('22222222-2222-2222-2222-222222222222', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Nothing beats the broth at Orussey. Truly nostalgic taste.'),
  ('44444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'The coconut cream on top looks heavenly!')
ON CONFLICT DO NOTHING;

-- Follows Seed
INSERT INTO public.follows (follower_id, following_id)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;
