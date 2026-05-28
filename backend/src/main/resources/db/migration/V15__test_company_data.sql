-- 테스트 데이터: PIPAi_테스트시나리오_v3 기준 3개 가상기업
-- 목적: 진단 로직(A군·B군) 판정 정확도 검증 + 대시보드 UI 출력 확인
-- 비밀번호: Test1234! (BCrypt 10 rounds)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  user_a_id  UUID;
  user_b_id  UUID;
  user_c_id  UUID;
  pwd_hash   TEXT;
BEGIN

  pwd_hash := crypt('Test1234!', gen_salt('bf', 10));

  -- ──────────────────────────────────────────────
  -- 1. users
  -- ──────────────────────────────────────────────
  INSERT INTO users (email, password, name, terms_service, terms_privacy, terms_marketing, terms_ai_usage)
  VALUES ('test-lemontree@pipai.test', pwd_hash, '김레몬', true, true, false, false)
  RETURNING id INTO user_a_id;

  INSERT INTO users (email, password, name, terms_service, terms_privacy, terms_marketing, terms_ai_usage)
  VALUES ('test-medical@pipai.test', pwd_hash, '이메디', true, true, false, false)
  RETURNING id INTO user_b_id;

  INSERT INTO users (email, password, name, terms_service, terms_privacy, terms_marketing, terms_ai_usage)
  VALUES ('test-green@pipai.test', pwd_hash, '박그린', true, true, false, false)
  RETURNING id INTO user_c_id;

  -- ──────────────────────────────────────────────
  -- 2. company_profiles
  -- ──────────────────────────────────────────────

  -- 기업 A: 꽃집 레몬트리 (위반 집중형 / 소상공인)
  INSERT INTO company_profiles (
    user_id,
    company_name, entity_type, founding_year, company_address,
    business_type, industry_detail, employee_count, annual_revenue, large_assets,
    subject_range, personal_data_items, sensitive_data_types, has_privacy_policy,
    collection_methods, collection_purposes, marketing_scope,
    destruction_policy_status,
    delegation_status, delegatee_types, contract_per_type,
    delegatee_disclosure_status, delegatee_audit_status, delegatee_education_status,
    provision_status, overseas_transfer_status,
    operating_channels,
    cctv_operation_status, cctv_signage_status, cctv_access_control,
    cctv_loc, cctv_retention,
    system_status,
    privacy_policy_url,
    cpo_status, internal_plan_status,
    encryption_status,
    marketing_status, marketing_channels, marketing_consent_type, marketing_night_send,
    future_revenue
  ) VALUES (
    user_a_id,
    '꽃집 레몬트리', '개인', '3~7년', '서울시 마포구',
    '도매·소매업', '온라인 꽃 배달 쇼핑몰', 3, '30억 ~ 50억원 미만', '아니오',
    '1천 ~ 1만명 미만', '성명,연락처,주소,이메일', NULL, true,
    '회원가입,주문·결제', '서비스 제공,회원 관리', NULL,
    '파기 절차 없음',
    '위탁함', '배송업체,결제대행(PG사)', '배송업체:구두계약,PG사:서면계약',
    '공개 안 함', '점검 안 함', '실시하지 않음',
    '제공 안 함', '이전 안 됨',
    '자체 웹사이트,SNS',
    '운영함', '미설치', '별도 관리 없음',
    '매장 내부', '30일 이내',
    '엑셀·문서로만 관리',
    'https://lemontree.example.com/privacy',
    '지정 안 함', '수립 안 함',
    '암호화 안 함',
    '발송함', '문자,이메일', '회원가입 시 필수 항목', '야간에도 발송함',
    '120억 ~ 400억원 미만'
  );

  -- 기업 B: 메디컬서비스코리아(주) (고위험 위반형 / 중기업)
  INSERT INTO company_profiles (
    user_id,
    company_name, entity_type, founding_year, company_address,
    business_type, industry_detail, employee_count, annual_revenue, large_assets,
    subject_range, personal_data_items, sensitive_data_types, has_privacy_policy,
    jumin_collection_ground,
    collection_methods, collection_purposes,
    destruction_policy_status, destruction_methods,
    delegation_status, delegatee_types, contract_per_type,
    cloud_server_location, overseas_server_country,
    delegatee_disclosure_status, delegatee_audit_status, delegatee_education_status,
    provision_status, provision_recipients, provision_consent_status,
    overseas_transfer_status, overseas_transfer_country,
    operating_channels, app_name,
    cctv_operation_status, cctv_signage_status, cctv_access_control,
    cctv_loc, cctv_retention,
    system_status,
    access_control_separation, retired_access_revocation, access_change_history_status,
    access_log_status,
    privacy_policy_url,
    cpo_status, cpo_title,
    internal_plan_status, internal_plan_cycle,
    encryption_status, encrypted_data_items,
    marketing_status,
    future_subject_scale
  ) VALUES (
    user_b_id,
    '메디컬서비스코리아(주)', '법인', '7년 이상', '서울시 강남구',
    '보건업·사회복지서비스업', '건강관리 앱 서비스', 180, '120억 ~ 400억원 미만', '아니오',
    '10만 ~ 50만명 미만', '성명,연락처,생년월일,이메일', '건강·의료정보,위치정보(GPS)', true,
    '정보주체 별도 동의',
    '회원가입,오프라인 서면 작성,자동 수집(쿠키)', '서비스 제공,회원 관리,통계 분석',
    '항목별 관리', '삭제',
    '위탁함', '클라우드(AWS),데이터 분석,고객센터·CS', '클라우드(AWS):계약없음,데이터분석:구두계약,고객센터:서면계약',
    '국외 포함', '미국',
    '일부만 공개', '비정기적', '실시함',
    '제공함', '보험사·금융기관', '없음',
    '이전됨', '미국',
    '자체 웹사이트,모바일 앱', '메디컬서비스코리아 앱',
    '운영함', '설치함', '담당자만 접근',
    '사무실', '30일 ~ 6개월',
    '보유함(CRM,회원관리)',
    '분리됨', '즉시 회수', '3년간 보관',
    '보관함',
    'https://medicalkorea.example.com/privacy',
    '지정함', '개인정보보호팀장',
    '수립함', '작성 후 갱신 없음',
    '일부만 암호화', '비밀번호(해시)',
    '발송 안 함',
    '100만명 돌파 예정'
  );

  -- 기업 C: (주)그린로지스틱스 (정상 준수형 / 소기업)
  INSERT INTO company_profiles (
    user_id,
    company_name, entity_type, founding_year, company_address,
    business_type, industry_detail, employee_count, annual_revenue, large_assets,
    subject_range, personal_data_items, sensitive_data_types, has_privacy_policy,
    collection_methods, collection_purposes, marketing_scope,
    destruction_policy_status, destruction_methods,
    delegation_status, delegatee_types, contract_per_type,
    cloud_server_location, overseas_server_country,
    delegatee_disclosure_status, delegatee_audit_status, delegatee_education_status,
    provision_status,
    overseas_transfer_status, overseas_transfer_country,
    operating_channels, marketplace_source,
    cctv_operation_status, cctv_signage_status, cctv_access_control,
    cctv_loc, cctv_retention,
    system_status,
    access_control_separation, retired_access_revocation, access_change_history_status,
    access_log_status,
    privacy_policy_url, privacy_policy_included_items,
    cpo_status, cpo_title,
    internal_plan_status, internal_plan_cycle,
    encryption_status,
    marketing_status, marketing_channels, marketing_consent_type, marketing_night_send,
    future_revenue, future_employees
  ) VALUES (
    user_c_id,
    '(주)그린로지스틱스', '법인', '7년 이상', '경기도 성남시',
    '운수업', '화물 물류 플랫폼', 45, '50억 ~ 80억원 미만', '아니오',
    '1만 ~ 5만명 미만', '성명,연락처,주소,이메일', NULL, true,
    '회원가입,주문·결제', '서비스 제공,회원 관리,마케팅·광고', '광고성 정보 전송',
    '항목별 관리', '삭제,덮어쓰기·초기화',
    '위탁함', '배송업체,결제대행(PG사),클라우드(AWS)', '배송업체:서면계약,PG사:서면계약,클라우드(AWS):서면계약',
    '국외 포함', '미국',
    '모두 공개', '연 1회 이상', '실시함',
    '제공 안 함',
    '이전됨', '미국',
    '자체 웹사이트,오픈마켓', '오픈마켓',
    '운영함', '설치함', '담당자만 접근',
    '사무실', '30일 이내',
    '보유함(CRM)',
    '분리됨', '즉시 회수', '3년간 보관',
    '보관함',
    'https://greenlogistics.example.com/privacy', '수집 항목,이용 목적,보유기간,제3자 제공,위탁,파기,정보주체 권리',
    '지정함', '경영지원팀장',
    '수립함', '연 1회 이상',
    '암호화 처리함',
    '발송함', '이메일', '별도 동의 절차', '야간 발송 안 함',
    '80억 ~ 120억원 미만', '60명'
  );

  -- ──────────────────────────────────────────────
  -- 3. risk_checklist_items
  -- ──────────────────────────────────────────────

  -- 기업 A: 꽃집 레몬트리 — 🔴×7, 🟡×4, 🟢×2, ⚪×3

  -- 🔴 즉시 조치 (7건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_a_id, 'A-04', 'CCTV 안내판 미설치',
     'CCTV를 운영하면서 안내판을 설치하지 않았습니다. 정보주체가 CCTV 설치 사실을 알 수 있도록 안내판을 즉시 설치해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제25조④ / 과태료 1천만원 이하', 'PROFILE'),

    (user_a_id, 'A-06', '수탁업체 서면계약 미체결',
     '배송업체와 구두 계약만 체결되어 있습니다. 개인정보 처리 위탁 시 반드시 서면 계약을 체결해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제26조① / 과태료 1천만원 이하', 'PROFILE'),

    (user_a_id, 'A-07', '마케팅 필수·선택 동의 미구분',
     '마케팅 수신 동의를 회원가입 필수 항목으로 일괄 수집하고 있습니다. 필수 동의와 선택 동의를 명확히 구분해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제22조③, 정보통신망법 제50조 / 과태료 3천만원 이하', 'PROFILE'),

    (user_a_id, 'A-22', '야간 마케팅 메시지 발송',
     '오후 9시~오전 8시 야간 시간대에 광고성 정보를 발송하고 있습니다. 야간 발송은 별도 사전 동의가 필요합니다.',
     'IMMEDIATE', '정보통신망법 제50조① / 과태료 3천만원 이하', 'PROFILE'),

    (user_a_id, 'A-24', '성장 시나리오 모순 입력',
     '매출 성장 예정(120~400억)과 변화 없음을 동시에 선택했습니다. 실제 계획에 맞게 수정이 필요합니다.',
     'IMMEDIATE', '입력 정합성 오류', 'PROFILE'),

    (user_a_id, 'A-25', '개인정보처리방침에 수탁자 미공개',
     '개인정보 처리를 위탁하면서 처리방침에 수탁자 정보를 공개하지 않았습니다. 수탁자 명칭과 위탁 업무를 처리방침에 기재해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제26조② / 과태료 1천만원 이하', 'PROFILE'),

    (user_a_id, 'B-08', '개인정보 파기 절차 없음',
     '개인정보 보유기간 경과 후 파기 절차가 마련되어 있지 않습니다. 파기 절차와 방법을 수립해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제21조, 개인정보의 안전성 확보조치 기준 제13조 / 과태료 3천만원 이하', 'PROFILE');

  -- 🟡 확인 필요 (4건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_a_id, 'A-20', '암호화 처리 권고',
     '현재 수집 중인 정보(성명, 연락처, 주소, 이메일)는 필수 암호화 대상은 아니나, 비밀번호 등 인증정보 암호화 여부를 확인하고 보안 조치를 강화할 것을 권장합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제29조', 'PROFILE'),

    (user_a_id, 'B-02', '수탁자 관리·감독 의무 미이행',
     '수탁자에 대한 정기 점검을 실시하지 않고 교육도 미실시 상태입니다. 수탁자가 개인정보를 안전하게 처리하는지 관리·감독해야 합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제26조④', 'PROFILE'),

    (user_a_id, 'B-09', '개인정보처리방침 필수 기재사항 누락',
     '처리방침에 CPO 연락처와 파기 절차·방법이 기재되어 있지 않습니다. 필수 기재사항을 보완해야 합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제30조', 'PROFILE'),

    (user_a_id, 'B-04', 'CCTV 영상 접근 권한 별도 관리 없음',
     'CCTV 영상에 대한 접근 권한이 별도로 관리되지 않고 있습니다. 영상 접근 권한자를 지정하고 관리 대장을 운영할 것을 권장합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제25조⑥', 'PROFILE');

  -- 🟢 양호 (2건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_a_id, 'A-01', '소상공인 분류 확인',
     '직원 3명, 도소매업 매출 30~50억원으로 소상공인에 해당합니다.',
     'GOOD', '중소기업기본법', 'PROFILE'),

    (user_a_id, 'A-05', '개인정보처리방침 게시 확인',
     '웹사이트에 개인정보처리방침을 게시하고 URL을 등록했습니다.',
     'GOOD', '개인정보 보호법 제30조', 'PROFILE');

  -- ⚪ 해당 없음 (3건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_a_id, 'A-02', 'CPO 지정 의무 면제',
     '소상공인에 해당하므로 개인정보 보호책임자(CPO) 지정 의무가 면제됩니다.',
     'EXEMPT', '개인정보 보호법 제31조 / 소상공인 면제', 'PROFILE'),

    (user_a_id, 'A-08', '접속기록 보관 의무 해당 없음',
     '엑셀·문서로만 관리하는 경우 개인정보처리시스템에 해당하지 않아 접속기록 보관 의무가 적용되지 않습니다.',
     'EXEMPT', '개인정보의 안전성 확보조치 기준 제8조', 'PROFILE'),

    (user_a_id, 'A-19', '내부관리계획 수립 의무 면제',
     '소상공인이면서 정보주체 수가 1만명 미만이므로 내부관리계획 수립 의무가 면제됩니다.',
     'EXEMPT', '개인정보의 안전성 확보조치 기준 제4조 / 소상공인+1만명 미만 면제', 'PROFILE');


  -- 기업 B: 메디컬서비스코리아(주) — 🔴×6, 🟡×8, 🟢×3

  -- 🔴 즉시 조치 (6건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_b_id, 'A-06', '수탁업체 서면계약 미체결',
     'AWS 클라우드 계약 없음, 데이터 분석업체와 구두 계약만 체결되어 있습니다. 2건의 위탁 계약을 즉시 서면으로 체결해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제26조① / 과태료 1천만원 이하', 'PROFILE'),

    (user_b_id, 'A-13', '주민번호 수집 법적 근거 미비',
     '주민등록번호는 정보주체의 별도 동의만으로 수집할 수 없습니다. 법령에 근거가 없는 주민번호 수집은 즉시 중단해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제24조의2① / 법령상 의무 외 주민번호 수집 불가', 'PROFILE'),

    (user_b_id, 'A-16', '동의 없이 제3자(보험사)에 개인정보 제공',
     '보험사·금융기관에 정보주체 동의 없이 개인정보를 제공하고 있습니다. 형사처벌(5년 이하 징역 또는 5천만원 이하 벌금) 수준의 위반입니다. 즉시 제공을 중단하고 동의를 받거나 법적 근거를 마련해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제17조① / 형사처벌 5년·5천만원', 'PROFILE'),

    (user_b_id, 'A-20', '주민번호 암호화 미이행',
     '주민등록번호를 수집하면서 암호화하지 않고 있습니다. 주민번호는 법적 필수 암호화 대상입니다.',
     'IMMEDIATE', '개인정보 보호법 제24조의2②, 개인정보의 안전성 확보조치 기준 제7조②', 'PROFILE'),

    (user_b_id, 'B-03', '필수 암호화 항목(주민번호) 미이행',
     '주민등록번호가 암호화 적용 항목에 포함되지 않았습니다. 주민번호는 반드시 암호화해야 하는 법적 의무 항목입니다.',
     'IMMEDIATE', '개인정보의 안전성 확보조치 기준 제7조②', 'PROFILE'),

    (user_b_id, 'B-07', '보유기간 경과 후 개인정보 미파기',
     '거래처 DB에 등록된 거래 종료 고객 정보를 계속 보관하고 있습니다. 보유기간이 경과한 개인정보는 즉시 파기해야 합니다.',
     'IMMEDIATE', '개인정보 보호법 제21조 / 과태료 3천만원 이하', 'PROFILE');

  -- 🟡 확인 필요 (8건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_b_id, 'A-03', '민감정보 출처 고지 의무 확인 필요',
     '10만~50만명 규모에 건강·의료 민감정보를 처리하고 있습니다. 정보주체 이외로부터 수집한 경우 출처 고지 의무가 있는지 확인이 필요합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제20조②', 'PROFILE'),

    (user_b_id, 'A-14', '민감정보(건강·의료) 별도 동의 여부 확인',
     '건강·의료정보는 민감정보로서 정보주체에게 별도 동의를 받아야 합니다. 현재 별도 동의 절차가 마련되어 있는지 확인이 필요합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제23조①', 'PROFILE'),

    (user_b_id, 'A-17', '국외 이전 보호조치 확인 필요',
     'AWS를 통해 개인정보가 미국 서버에 저장됩니다. 미국은 EU·영국과 달리 한국과의 적정성 결정이 없으므로 제28조의8에 따른 보호조치 계약 체결 여부를 확인해야 합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제28조의8', 'PROFILE'),

    (user_b_id, 'A-19', '내부관리계획 갱신 없음',
     '내부관리계획을 수립했으나 작성 이후 갱신된 적 없습니다. 연 1회 이상 점검하고 변경 사항을 반영해야 합니다.',
     'CHECK_NEEDED', '개인정보의 안전성 확보조치 기준 제4조④', 'PROFILE'),

    (user_b_id, 'A-24', '정보주체 100만명 돌파 시 이용·제공 내역 통지 의무 발생',
     '100만명 돌파 예정 시 개인정보 이용·제공 내역을 정기적으로 통지해야 하는 의무가 발생합니다. 사전 준비가 필요합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제20조의2', 'PROFILE'),

    (user_b_id, 'A-25', '처리방침에 수탁자 일부만 공개',
     '처리방침에 수탁자 일부만 공개되어 있습니다. 모든 수탁자 정보를 처리방침에 공개해야 합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제26조②', 'PROFILE'),

    (user_b_id, 'B-08', '오프라인 서면 수집 시 종이 파기 방법 미설정',
     '오프라인 서면으로 개인정보를 수집하면서 파기 방법으로 삭제만 체크하고 소각·파쇄가 누락되었습니다. 종이 서류에 대한 파기 방법을 추가해야 합니다.',
     'CHECK_NEEDED', '개인정보의 안전성 확보조치 기준 제13조', 'PROFILE'),

    (user_b_id, 'B-09', '처리방침에 자동 수집 장치(쿠키) 미기재',
     '쿠키와 접속 로그를 통해 개인정보를 자동 수집하면서 처리방침에 자동 수집 장치에 대한 내용이 기재되지 않았습니다.',
     'CHECK_NEEDED', '개인정보 보호법 제30조', 'PROFILE');

  -- 🟢 양호 (3건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_b_id, 'A-01', '중기업 분류 확인',
     '직원 180명, 보건업 매출 250억원으로 중기업에 해당합니다.',
     'GOOD', '중소기업기본법', 'PROFILE'),

    (user_b_id, 'A-02', 'CPO 지정 확인',
     '개인정보 보호책임자(CPO)가 지정되어 있습니다. (개인정보보호팀장)',
     'GOOD', '개인정보 보호법 제31조', 'PROFILE'),

    (user_b_id, 'A-04', 'CCTV 안내판 설치 확인',
     'CCTV를 운영하며 안내판을 설치하고 있습니다.',
     'GOOD', '개인정보 보호법 제25조④', 'PROFILE');


  -- 기업 C: (주)그린로지스틱스 — 🔴×0, 🟡×3, 🟢×13

  -- 🟡 확인 필요 (3건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_c_id, 'A-23', '오픈마켓 고객 정보 처리 검토 필요',
     '오픈마켓에서 일부 고객 정보를 전달받고 있습니다. 처리방침에 해당 범위를 명시하고, 위탁 해당 여부를 검토할 것을 권장합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제26조', 'PROFILE'),

    (user_c_id, 'A-24', '성장 예정 시 사업자 규모 기준 유지 확인',
     '매출 80~120억 및 직원 60명 예정으로 소기업 기준을 유지할 것으로 예상되어 추가 의무 발생은 없습니다. 규모 변화 시 재확인이 필요합니다.',
     'CHECK_NEEDED', '중소기업기본법', 'PROFILE'),

    (user_c_id, 'B-10', 'AWS 국외 이전 보호조치 확인 필요',
     'AWS를 통해 개인정보가 미국 서버에 저장됩니다. 미국은 적정성 결정이 없으므로 제28조의8에 따른 보호조치 계약 체결 여부를 확인할 것을 권장합니다.',
     'CHECK_NEEDED', '개인정보 보호법 제28조의8', 'PROFILE');

  -- 🟢 양호 (13건)
  INSERT INTO risk_checklist_items (user_id, diagnosis_code, title, description, level, related_law, source_type)
  VALUES
    (user_c_id, 'A-01', '소기업 분류 확인',
     '운수업 직원 45명, 매출 70억원으로 소기업에 해당합니다.',
     'GOOD', '중소기업기본법', 'PROFILE'),

    (user_c_id, 'A-02', 'CPO 지정 확인',
     '개인정보 보호책임자(CPO)가 지정되어 있습니다. (경영지원팀장)',
     'GOOD', '개인정보 보호법 제31조', 'PROFILE'),

    (user_c_id, 'A-04', 'CCTV 안내판 설치 확인',
     'CCTV를 운영하며 안내판이 설치되어 있습니다.',
     'GOOD', '개인정보 보호법 제25조④', 'PROFILE'),

    (user_c_id, 'A-05', '개인정보처리방침 게시 확인',
     '웹사이트에 개인정보처리방침을 게시하고 7개 필수 기재사항이 모두 포함되어 있습니다.',
     'GOOD', '개인정보 보호법 제30조', 'PROFILE'),

    (user_c_id, 'A-06', '전 수탁자 서면계약 체결 확인',
     '배송업체, PG사, 클라우드(AWS) 모든 수탁자와 서면 계약이 체결되어 있습니다.',
     'GOOD', '개인정보 보호법 제26조①', 'PROFILE'),

    (user_c_id, 'A-07', '마케팅 별도 동의 절차 확인',
     '마케팅 동의를 회원가입과 별도 절차로 수집하고 있습니다.',
     'GOOD', '개인정보 보호법 제22조③', 'PROFILE'),

    (user_c_id, 'A-08', '접속기록 보관 확인',
     '개인정보처리시스템(CRM) 보유 + 접속기록 보관 중입니다. 정보주체 1만~5만명, 민감정보 없음으로 1년 보관 의무를 준수하고 있습니다.',
     'GOOD', '개인정보의 안전성 확보조치 기준 제8조', 'PROFILE'),

    (user_c_id, 'A-09', '이용 목적 정합성 확인',
     '마케팅·광고 이용 목적 체크와 마케팅 활동 범위 입력이 일치합니다.',
     'GOOD', '개인정보 보호법 제15조', 'PROFILE'),

    (user_c_id, 'A-10', '마케팅 채널 정합성 확인',
     '이메일 발송 채널과 이메일 수집 항목이 일치합니다.',
     'GOOD', '정보통신망법 제50조', 'PROFILE'),

    (user_c_id, 'A-19', '내부관리계획 수립 및 정기 점검 확인',
     '내부관리계획을 수립하고 연 1회 이상 점검하고 있습니다.',
     'GOOD', '개인정보의 안전성 확보조치 기준 제4조', 'PROFILE'),

    (user_c_id, 'A-20', '암호화 처리 확인',
     '개인정보에 대한 암호화 처리가 되어 있습니다.',
     'GOOD', '개인정보 보호법 제29조, 개인정보의 안전성 확보조치 기준 제7조', 'PROFILE'),

    (user_c_id, 'A-22', '야간 발송 없음 확인',
     '야간(오후 9시~오전 8시) 마케팅 메시지 발송을 하지 않고 있습니다.',
     'GOOD', '정보통신망법 제50조①', 'PROFILE'),

    (user_c_id, 'A-25', '처리방침에 전 수탁자 공개 확인',
     '처리방침에 모든 수탁자 정보가 공개되어 있습니다.',
     'GOOD', '개인정보 보호법 제26조②', 'PROFILE');

END $$;
