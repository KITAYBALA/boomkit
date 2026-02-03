-- Grant ALL Gamepass Booms for levels 10-100 to HadiGidek
-- Since the user already reached level 100, they should have all milestone rewards

UPDATE users 
SET booms = booms ||
  jsonb_build_object(
    'Bronze Medal', 1,
    'Silver Trophy', 1,
    'Gold Trophy', 1,
    'Emerald Star', 1,
    'Sapphire Heart', 1,
    'Ruby Shield', 1,
    'Amethyst Sword', 1,
    'Diamond Crown', 1,
    'Prismatic Phoenix', 1,
    'Cosmic Admin Engine', 1
  )
WHERE username = 'HadiGidek' AND level >= 100;

-- Verification
SELECT 
  id, 
  username, 
  level,
  booms->'Bronze Medal' as bronze_medal,
  booms->'Silver Trophy' as silver_trophy,
  booms->'Gold Trophy' as gold_trophy,
  booms->'Emerald Star' as emerald_star,
  booms->'Sapphire Heart' as sapphire_heart,
  booms->'Ruby Shield' as ruby_shield,
  booms->'Amethyst Sword' as amethyst_sword,
  booms->'Diamond Crown' as diamond_crown,
  booms->'Prismatic Phoenix' as prismatic_phoenix,
  booms->'Cosmic Admin Engine' as cosmic_admin_engine
FROM users 
WHERE username = 'HadiGidek';
