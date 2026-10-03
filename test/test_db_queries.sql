-- Test inserting sample stories into local D1
-- 1. Insert a published story
INSERT INTO stories (
  id, source_id, source_url, source_guid, title, description,
  image_url, author, published_at, category, language,
  status, content_hash, created_at, updated_at
) VALUES (
  'test_story_pub_1',
  'src_pib_mr',
  'https://pib.gov.in/test-article-1',
  'guid-pib-101',
  'महाराष्ट्र ग्रामीण पाणीपुरवठा व सिंचन प्रकल्पाचा विस्तार',
  'महाराष्ट्र शासनाने ग्रामीण जलसंधारणासाठी ३ हजार कोटींचा विशेष निधी मंजूर केला.',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  'विशेष प्रतिनिधी',
  '2026-10-02T05:00:00Z',
  'महाराष्ट्र',
  'mr',
  'published',
  'hash_abc12345',
  datetime('now'),
  datetime('now')
);

-- 2. Insert an incoming (unpublished) story
INSERT INTO stories (
  id, source_id, source_url, source_guid, title, description,
  image_url, author, published_at, category, language,
  status, content_hash, created_at, updated_at
) VALUES (
  'test_story_inc_2',
  'src_air_mr',
  'https://newsonair.gov.in/test-article-2',
  'guid-air-202',
  'संसदेत नवीन ऊर्जा सुरक्षा विधेयक मांडले',
  'केंद्रीय मंत्र्यांनी संसदेत सौर व हरित ऊर्जेचे विधेयक सादर केले.',
  NULL,
  'आकाशवाणी प्रतिनिधी',
  '2026-10-02T06:00:00Z',
  'देश',
  'mr',
  'incoming',
  'hash_def67890',
  datetime('now'),
  datetime('now')
);

-- 3. Insert another published story in 'अर्थव्यवस्था'
INSERT INTO stories (
  id, source_id, source_url, source_guid, title, description,
  image_url, author, published_at, category, language,
  status, content_hash, created_at, updated_at
) VALUES (
  'test_story_pub_3',
  'src_sakal_mr',
  'https://www.esakal.com/test-article-3',
  'guid-sakal-303',
  'राज्यातील कापूस बाजारात सुधारणा; हमीभाव केंद्रांवर विक्रमी आवक',
  'विदर्भ आणि मराठवाड्यातील बाजारात कापसाचे भाव स्थिर राहिले आहेत.',
  'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=800&q=80',
  'अर्थ वार्ताहर',
  '2026-10-02T07:00:00Z',
  'अर्थव्यवस्था',
  'mr',
  'published',
  'hash_ghi99999',
  datetime('now'),
  datetime('now')
);
