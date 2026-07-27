-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Seed: blog stories imported from whrdhub.org                          ║
-- ║  Run AFTER 001_hub_saas_schema.sql. Safe to run more than once         ║
-- ║  (upsert on slug). These are the Hub's own posts; each carries a link  ║
-- ║  back to the full article on whrdhub.org.                             ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Optional cleanup: if an earlier run seeded all 47 counties, drop the ones
-- that are not shared networks and are not referenced anywhere.
delete from public.county_networks
where slug not in ('bomet','kisumu','kitui','marsabit','meru','mombasa','nairobi','nakuru')
  and id not in (select county_network_id from public.profiles       where county_network_id is not null)
  and id not in (select county_network_id from public.organizations  where county_network_id is not null);

insert into public.blogs
  (title, slug, excerpt, body, cover_image_url, is_hub, status, published_at)
values
  (
    'Rasna Warah',
    'rasna-warah',
    'Remembering Rasna Warah, a bold Kenyan journalist, author, and human rights champion driven by a deep sense of justice.',
    E'Rasna Warah, who passed away on January 11, 2025, at the age of 63, was a bold and brilliant Kenyan journalist, author, and human rights champion. Her life''s work was driven by a deep sense of justice, and she never shied away from speaking uncomfortable truths no matter how powerful the people or institutions involved.\n\nRead the full tribute on whrdhub.org: https://whrdhub.org/2025/04/07/rasna-warah/',
    'https://whrdhub.org/wp-content/uploads/2025/04/Rasna-Warah.jpg',
    true, 'approved', timestamptz '2025-04-07 09:00+03'
  ),
  (
    'International Women''s Day 2025',
    'international-womens-day-2025',
    'More than a celebration, a call to action. We shared stories of courage and launched Rooted in Courage.',
    E'International Women''s Day 2025 was more than a celebration, it was a call to action. As we shared stories of courage and launched Rooted in Courage, we reaffirmed our commitment to ending GBV and advancing gender equality.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2025/03/17/international-womens-day-2025/',
    'https://whrdhub.org/wp-content/uploads/2025/03/IMG_0764-scaled.jpg',
    true, 'approved', timestamptz '2025-03-17 09:00+03'
  ),
  (
    'The Hub''s First Donor Roundtable',
    'first-donor-roundtable',
    'Our first Donor Roundtable, with support from the Open Society Foundations, marked a new chapter of partnership for women human rights defenders.',
    E'On September 10th, 2024, we hosted our first Donor Roundtable, marking a key moment in our journey. With support from the Open Society Foundations, this event was an important step towards building partnerships that align with our mission of supporting women human rights defenders (WHRDs) in Kenya and beyond, as part of our 2024 to 2029 Strategic Plan.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2024/09/26/building-partnerships-for-change-the-hubs-first-donor-roundtable-marks-a-new-chapter-for-women-human-rights-defenders/',
    'https://whrdhub.org/wp-content/uploads/2024/09/0I2A7208-scaled.jpg',
    true, 'approved', timestamptz '2024-09-26 09:00+03'
  ),
  (
    'Safety and Security Training Program',
    'safety-and-security-training-program',
    'A one-week safety and security training with practical exercises, empowering participants to assess risks and respond to emergencies.',
    E'A comprehensive one week safety and security training program with engaging sessions and practical exercises, empowering participants with vital knowledge and skills to assess risks, implement preventative measures, and respond effectively to emergencies.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2024/05/28/safety-and-security-training-program/',
    'https://whrdhub.org/wp-content/uploads/2024/05/WhatsApp-Image-2024-05-28-at-12.39.20.jpeg',
    true, 'approved', timestamptz '2024-05-28 09:00+03'
  ),
  (
    'WHRDHUB Strategic Plan 2024-2028 Validation',
    'strategic-plan-2024-2028-validation',
    'A momentous validation workshop for our Strategic Plan, showcasing our dedication to the livelihoods, safety, mentorship, and wellbeing of WHRDs.',
    E'What a momentous day at the validation workshop for the Women Human Rights Defenders Hub SP 2024 to 28. With partners and key stakeholders in attendance, we proudly showcased our dedication to enhancing the livelihoods, safety, mentorship, and wellbeing of WHRDs. The day provided a valuable opportunity to reflect on our achievements and stress the significance of the Strategic Plan in shaping the future.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2024/05/28/whrdhub-strategic-plan-2024-2028-validation/',
    'https://whrdhub.org/wp-content/uploads/2024/05/DSC_8300-scaled.jpg',
    true, 'approved', timestamptz '2024-05-28 10:00+03'
  ),
  (
    'Convening Protection Networks for Uganda, Kenya and Tanzania',
    'protection-networks-consortium-convening',
    'Gathering with the East Africa Women Human Rights Network to strengthen protection networks across the region.',
    E'In Uganda, East Africa, we gathered with a group of incredible individuals as part of the East Africa Women Human Rights Network to convene and strengthen protection networks for Uganda, Kenya and Tanzania.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2024/05/28/protection-networks-consortium-convening-protection-networks-for-uganda-kenya-and-tanzania/',
    'https://whrdhub.org/wp-content/uploads/2024/05/WhatsApp-Image-2024-05-28-at-12.27.40-1.jpeg',
    true, 'approved', timestamptz '2024-05-28 11:00+03'
  ),
  (
    'Meeting with Delegates from the French Embassy',
    'meeting-with-delegates-french-embassy',
    'The Hub met with delegates from the French Embassy and strategic partners for deliberations on technology and its careful application.',
    E'The Hub, in the company of delegates from the French Embassy and other strategic partners, held a constructive deliberation on gene drives and technological remedies that could be adopted. The gathering came in appreciation of the great strides realized in genetic science and the urgency to handle these discoveries with care.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2024/05/28/meeting-with-delegates-from-the-french-embassy/',
    'https://whrdhub.org/wp-content/uploads/2024/05/WhatsApp-Image-2024-05-28-at-12.26.32.jpeg',
    true, 'approved', timestamptz '2024-05-28 12:00+03'
  ),
  (
    'Joannah Stutchbury',
    'joannah-stutchbury',
    'Honouring the memory of Joannah Stutchbury, who defended human rights and the environment in Kiambu County.',
    E'We honor the memory of Joannah Stutchbury, a courageous woman who defended human rights and the environment. Tragically, she was allegedly murdered for her stance against environmental injustice in Kiambu Forest, Kiambu County.\n\nRead the full tribute on whrdhub.org: https://whrdhub.org/2024/05/24/joannah-stutchbury/',
    'https://whrdhub.org/wp-content/uploads/2024/05/WhatsApp-Image-2021-08-02-at-02.03.06.jpeg',
    true, 'approved', timestamptz '2024-05-24 09:00+03'
  ),
  (
    'Elizabeth Ekaru',
    'elizabeth-ekaru',
    'Remembering Elizabeth Ibrahim Ekaru, a champion of women''s rights and an environmental and land rights advocate.',
    E'Elizabeth Ibrahim Ekaru was an ardent champion of women''s rights and an environmental and land rights advocate, in addition to being a peacemaker. Elizabeth was previously acknowledged for her efforts when she was awarded the Head of State Commendation Award for bravery and leadership in the fight for human rights in Kenya.\n\nRead the full tribute on whrdhub.org: https://whrdhub.org/2024/05/24/elizabeth-ekaru/',
    'https://whrdhub.org/wp-content/uploads/2024/05/download-3.jpg',
    true, 'approved', timestamptz '2024-05-24 10:00+03'
  ),
  (
    'IWHRD Celebrations 2023',
    'iwhrd-celebrations-2023',
    'Celebrating International Women Human Rights Defenders Day 2023 with our networks and partners.',
    E'The Hub marked International Women Human Rights Defenders Day 2023 with our networks and partners, celebrating the courage of defenders and recommitting to their protection and wellbeing.\n\nRead the full story on whrdhub.org: https://whrdhub.org/2024/05/24/iwhrd-celebrations-2023/',
    'https://whrdhub.org/wp-content/uploads/2024/05/Capture.png',
    true, 'approved', timestamptz '2024-05-24 11:00+03'
  )
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  cover_image_url = excluded.cover_image_url,
  status = 'approved',
  is_hub = true,
  published_at = excluded.published_at;
