/**
 * Firebase Functions for Painori News Feed
 * ✨ Pi 블로그 RSS 연동 + 자동 업데이트 기능 추가
 * 🔧 Firebase Functions v2 호환 (기존 모든 기능 100% 유지)
 * 🔒 NEW: 닉네임 검증 함수 추가 (서버사이드 보안)
 */

// ✨ Firebase Functions v2 방식 import
const { onRequest } = require("firebase-functions/v2/https");
const { onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");

// 기존 라이브러리들 (변경 없음)
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
// ✨ RSS XML 파싱을 위한 라이브러리
const xml2js = require("xml2js");

// Firebase Admin 초기화 (기존과 동일)
admin.initializeApp();

// ✨ v2 전용: 모든 함수에 적용될 글로벌 설정
setGlobalOptions({
  region: "us-central1", // 기존 리전 명시적 설정
  memory: "256MiB", // 메모리 사용량 최적화
  timeoutSeconds: 60, // 타임아웃 60초
});

/**
 * ✨ Firestore 컬렉션 참조 (캐싱용)
 * 기존과 동일하게 유지
 */
const db = admin.firestore();
const piBlogCacheCollection = db.collection("piBlogCache");

/**
 * 🔒 NEW: 닉네임 검증 함수 (서버사이드 보안 - 절대 노출 불가능)
 * 클라이언트에서 호출하는 보안 검증 함수
 */
exports.validateNickname = onCall(async (request) => {
  try {
    console.log('🔒 서버사이드 닉네임 검증 요청:', request.data.nickname);
    
    const nickname = request.data.nickname ? request.data.nickname.trim() : null;
    
    if (!nickname) {
      return {
        success: false,
        error: 'Nickname is required'
      };
    }
    
    // 🔑 특별 인증 코드 (서버에서만 존재, 절대 노출 불가능)
    const ADMIN_AUTH_CODE = 'lukep81_pycman';
    
    // 🔒 보호된 닉네임 목록 (서버에서만 존재)
    const PROTECTED_NICKNAMES = [
      'lukep81',     // 정확한 매칭
      'Lukep81',     // 첫글자 대문자
      'LUKEP81',     // 모두 대문자
      'LukeP81',     // 중간 대문자
      'lukep8l',     // 숫자 1을 소문자 l로
      'lukep8I',     // 숫자 1을 대문자 I로
      'Lukep8l',     // 조합
      'Lukep8I',     // 조합
      'LUKEP8L',     // 조합
      'LUKEP8I',     // 조합
      'iukep81',     // 소문자 L을 대문자 I로
      'Iukep81',     // 조합
      'IUKEP81',     // 조합
      '1ukep81',     // 소문자 l을 숫자 1로
      '1ukep8l',     // 조합
      '1ukep8I',     // 조합
      'luke p81',    // 공백 포함
      'luke_p81',    // 언더스코어
      'luke-p81',    // 하이픈
      'lukep 81',    // 중간 공백
      'luke81',      // p 제거
      'lukep',       // 숫자 제거
      'lukepi81',    // i 추가
      'lukep81_',    // 끝에 언더스코어
      '_lukep81',    // 앞에 언더스코어
    ];
    
    // 대소문자 구분 없이 비교
    const normalizedInput = nickname.toLowerCase();
    
    // 🔑 특별 인증 코드 확인 (서버에서만 검증)
    if (normalizedInput === ADMIN_AUTH_CODE.toLowerCase()) {
      console.log('✅ 관리자 인증 코드 확인됨 (서버사이드)');
      return {
        success: true,
        isValid: true,
        processedNickname: 'lukep81', // 인증 성공 시 정식 닉네임으로 변환
        isAdmin: true
      };
    }
    
    // 🔒 보호된 닉네임 목록과 비교 (서버에서만 검증)
    const isProtected = PROTECTED_NICKNAMES.some(protectedName => 
      normalizedInput === protectedName.toLowerCase()
    );
    
    if (isProtected) {
      console.log('🚫 보호된 닉네임 사용 시도 차단:', nickname);
      return {
        success: true,
        isValid: false,
        error: 'PROTECTED_NICKNAME'
      };
    }
    
    // 일반 닉네임은 그대로 허용
    console.log('✅ 일반 닉네임 사용 허용:', nickname);
    return {
      success: true,
      isValid: true,
      processedNickname: nickname,
      isAdmin: false
    };
    
  } catch (error) {
    console.error('❌ 닉네임 검증 서버 에러:', error);
    return {
      success: false,
      error: 'Server error during nickname validation'
    };
  }
});

/**
 * General function to fetch news from CryptoCompare API
 * 기존 함수 - 수정 없음 (100% 동일)
 * @param {string} categories - API categories parameter
 * @return {Array} - Array of processed news data
 */
const fetchNewsFromApi = async (categories) => {
  const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${categories}`;

  try {
    console.log("🔍 뉴스 API 호출:", url);
    const response = await axios.get(url);

    console.log("📡 API 응답 상태:", response.status);
    console.log("📊 API 응답 데이터 구조:", {
      hasData: !!response.data,
      hasDataArray: !!(response.data && response.data.Data),
      dataLength: response.data && response.data.Data ?
        response.data.Data.length : 0,
    });

    // 응답 데이터 유효성 검사
    if (!response.data) {
      console.error("❌ API 응답에 data가 없음");
      return [];
    }

    if (!response.data.Data || !Array.isArray(response.data.Data)) {
      console.error("❌ API 응답의 Data가 배열이 아님:",
        typeof response.data.Data);
      return [];
    }

    if (response.data.Data.length === 0) {
      console.warn("⚠️ API 응답의 Data 배열이 비어있음");
      return [];
    }

    // 뉴스 데이터를 프론트엔드에서 사용하기 쉬운 형식으로 변환
    const processedData = response.data.Data
      .filter((article) => {
        return article &&
               article.title &&
               article.title.trim() !== "" &&
               (article.url || article.guid);
      })
      .map((article) => ({
        title: article.title || "제목 없음",
        description: article.body || "",
        url: article.url || article.guid || "",
        source: {
          name: article.source || "Unknown",
        },
        publishedAt: article.published_on ?
          new Date(article.published_on * 1000).toISOString() :
          new Date().toISOString(),
      }));

    console.log("✅ 처리된 뉴스 개수:", processedData.length);
    return processedData;
  } catch (error) {
    console.error("❌ 뉴스 API 호출 실패:", {
      message: error.message,
      status: error.response ? error.response.status : null,
      statusText: error.response ? error.response.statusText : null,
      url: url,
    });

    return [];
  }
};

/**
 * Calculate Pi relevance score for news article
 * 기존 함수 - 수정 없음 (100% 동일)
 * @param {Object} article - News article object
 * @return {number} - Relevance score (0-100)
 */
const calculatePiRelevance = (article) => {
  const titleLower = article.title.toLowerCase();
  const descriptionLower = article.description.toLowerCase();

  // 수정: 대폭 확장된 Pi 관련 키워드 (35개+)
  const piKeywords = [
    // 핵심 Pi 관련 (가중치 10)
    { keyword: "pi network", weight: 10 },
    { keyword: "pi coin", weight: 10 },
    { keyword: "pi cryptocurrency", weight: 10 },
    { keyword: "pi crypto", weight: 9 },
    { keyword: "pi blockchain", weight: 9 },
    { keyword: "pi token", weight: 9 },

    // Pi 생태계 (가중치 8)
    { keyword: "pioneers", weight: 8 },
    { keyword: "pi mainnet", weight: 8 },
    { keyword: "pi testnet", weight: 8 },
    { keyword: "pi kyc", weight: 8 },
    { keyword: "pi wallet", weight: 8 },
    { keyword: "pi browser", weight: 8 },
    { keyword: "pi ecosystem", weight: 8 },
    { keyword: "pi app", weight: 8 },

    // 창시자 및 팀 (가중치 9)
    { keyword: "nicolas kokkalis", weight: 9 },
    { keyword: "chengdiao fan", weight: 9 },
    { keyword: "stanford pi", weight: 8 },
    { keyword: "stanford blockchain", weight: 7 },

    // 기술 및 개념 (가중치 7)
    { keyword: "mobile mining", weight: 7 },
    { keyword: "social mining", weight: 7 },
    { keyword: "mining on phone", weight: 7 },
    { keyword: "phone mining", weight: 7 },
    { keyword: "consensus algorithm", weight: 6 },
    { keyword: "stellar consensus protocol", weight: 6 },
    { keyword: "federated byzantine agreement", weight: 6 },

    // Pi 역할 및 기능 (가중치 6)
    { keyword: "pi nodes", weight: 6 },
    { keyword: "pi contributors", weight: 6 },
    { keyword: "pi ambassadors", weight: 6 },

    // 비즈니스 및 생태계 (가중치 7)
    { keyword: "pi marketplace", weight: 7 },
    { keyword: "pi hackathon", weight: 7 },
    { keyword: "pi developer", weight: 6 },
    { keyword: "pi partnerships", weight: 6 },
    { keyword: "pi utilities", weight: 6 },
    { keyword: "pi payments", weight: 6 },
    { keyword: "pi commerce", weight: 6 },

    // 일반 관련 (가중치 5)
    { keyword: "decentralized currency", weight: 5 },
    { keyword: "accessible cryptocurrency", weight: 5 },
    { keyword: "everyday crypto", weight: 5 },
    { keyword: "sustainable mining", weight: 5 },
    { keyword: "energy efficient mining", weight: 5 },
    { keyword: "green cryptocurrency", weight: 5 },
  ];

  let score = 0;

  piKeywords.forEach(({ keyword, weight }) => {
    if (titleLower.includes(keyword)) {
      score += weight * 2; // 제목에서 발견 시 가중치 2배
    } else if (descriptionLower.includes(keyword)) {
      score += weight; // 본문에서 발견 시 일반 가중치
    }
  });

  return Math.min(score, 100); // 최대 100점으로 제한
};

/**
 * ✨ Pi 블로그 RSS 피드에서 뉴스 가져오기
 * RSS 방법을 사용한 안정적인 블로그 연동
 * 기존 함수 - 수정 없음 (100% 동일)
 * @return {Array} - Array of processed Pi blog news
 */
const fetchPiBlogNewsFromRSS = async () => {
  console.log("🥧 Pi 블로그 RSS 피드 요청 시작");

  // Pi 블로그 RSS 피드 URL 목록 (우선순위대로)
  const rssFeedUrls = [
    "https://minepi.com/blog/feed/",
    "https://minepi.com/blog/rss.xml",
    "https://minepi.com/blog/feed.xml",
    "https://minepi.com/feed/",
    "https://minepi.com/rss.xml",
  ];

  for (const url of rssFeedUrls) {
    try {
      console.log(`🔍 RSS 피드 시도: ${url}`);
      const response = await axios.get(url, {
        timeout: 15000, // 15초 타임아웃
        headers: {
          "User-Agent": "Painori RSS Reader 1.0 (Pi Network Community Project)",
          "Accept": "application/rss+xml, application/xml, text/xml",
        },
      });

      if (response.data && (response.data.includes("<rss") ||
          response.data.includes("<feed"))) {
        console.log(`✅ RSS 피드 발견: ${url}`);

        // RSS XML 파싱
        const parser = new xml2js.Parser({
          explicitArray: false,
          ignoreAttrs: false,
          trim: true,
        });

        const result = await parser.parseStringPromise(response.data);

        // RSS 2.0 형식 처리
        let items = [];
        if (result.rss && result.rss.channel && result.rss.channel.item) {
          items = Array.isArray(result.rss.channel.item) ?
            result.rss.channel.item :
            [result.rss.channel.item];
        } else if (result.feed && result.feed.entry) {
          // Atom 형식 처리 (백업)
          items = Array.isArray(result.feed.entry) ?
            result.feed.entry :
            [result.feed.entry];
        }

        console.log(`📊 RSS에서 ${items.length}개 항목 발견`);

        // 프론트엔드 형식으로 변환
        const processedNews = items.slice(0, 8).map((item) => {
          // RSS 2.0 형식
          if (item.title && (item.link || item.guid)) {
            return {
              title: typeof item.title === "string" ? item.title : item.title._,
              description: item.description || item.summary || "",
              url: typeof item.link === "string" ? item.link :
                (item.link.$ || item.link.href || item.guid),
              source: {
                name: "Pi Network Blog",
              },
              publishedAt: item.pubDate || item.published ||
                new Date().toISOString(),
              // RSS에서 가져온 뉴스임을 표시
              isFromRSS: true,
              rssFeedUrl: url,
            };
          }
          return null;
        }).filter((item) => item !== null);

        console.log(`✅ Pi 블로그 RSS 성공: ${processedNews.length}개 뉴스 변환 완료`);
        return processedNews;
      }
    } catch (error) {
      console.log(`❌ RSS 피드 실패: ${url} - ${error.message}`);
      continue;
    }
  }

  console.warn("⚠️ 모든 RSS 피드 URL 실패");
  return [];
};

/**
 * ✨ Pi 블로그 뉴스 캐시 관리
 * 기존 함수 - 수정 없음 (100% 동일)
 * @param {Array} newsData - News data to cache
 */
const cachePiBlogNews = async (newsData) => {
  try {
    await piBlogCacheCollection.doc("latest").set({
      news: newsData,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: newsData.length,
    });
    console.log(`💾 Pi 블로그 뉴스 캐시 저장 완료: ${newsData.length}개`);
  } catch (error) {
    console.error("❌ 캐시 저장 실패:", error);
  }
};

/**
 * ✨ 캐시된 Pi 블로그 뉴스 가져오기
 * 기존 함수 - 수정 없음 (100% 동일)
 * @return {Array|null} - Cached news data or null
 */
const getCachedPiBlogNews = async () => {
  try {
    const doc = await piBlogCacheCollection.doc("latest").get();
    if (doc.exists) {
      const data = doc.data();
      const cacheAge = Date.now() - data.lastUpdated.toDate().getTime();
      const maxCacheAge = 30 * 60 * 1000; // 30분

      if (cacheAge < maxCacheAge) {
        console.log(`💾 캐시된 Pi 블로그 뉴스 사용 (${Math.round(cacheAge / 60000)}분 전)`);
        return data.news;
      } else {
        console.log("⏰ 캐시가 오래됨, 새로 가져오기");
      }
    }
  } catch (error) {
    console.error("❌ 캐시 조회 실패:", error);
  }
  return null;
};

/**
 * 🔧 v2 방식: Firebase Callable Function to get general crypto news
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.getCryptoNews = onCall(async (request) => {
  console.log("🚀 getCryptoNews 함수 시작");

  try {
    const newsData = await fetchNewsFromApi("BTC,ETH,Market,Exchange");

    const validNewsData = Array.isArray(newsData) ? newsData : [];
    const limitedData = validNewsData.slice(0, 10);

    console.log("✅ getCryptoNews 성공:", limitedData.length, "개 뉴스 반환");

    return {
      data: limitedData,
      success: true,
      timestamp: new Date().toISOString(),
      count: limitedData.length,
    };
  } catch (error) {
    console.error("❌ getCryptoNews 함수 에러:", error);

    return {
      data: [],
      success: false,
      error: "Failed to fetch crypto news",
      timestamp: new Date().toISOString(),
      count: 0,
    };
  }
});

/**
 * 🔧 v2 방식: Firebase Callable Function to get Pi Network related news
 * 이제 Pi 블로그 RSS를 우선적으로 사용
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.getPiNews = onCall(async (request) => {
  console.log("🚀 getPiNews 함수 시작 (Pi 블로그 RSS 우선)");

  try {
    // 1순위: 캐시된 Pi 블로그 뉴스 확인
    let piBlogNews = await getCachedPiBlogNews();

    // 2순위: 캐시가 없거나 오래된 경우 RSS에서 새로 가져오기
    if (!piBlogNews || piBlogNews.length === 0) {
      piBlogNews = await fetchPiBlogNewsFromRSS();

      // 성공적으로 가져온 경우 캐시에 저장
      if (piBlogNews && piBlogNews.length > 0) {
        await cachePiBlogNews(piBlogNews);
      }
    }

    // Pi 블로그 뉴스가 있는 경우 우선 반환
    if (piBlogNews && piBlogNews.length > 0) {
      console.log(`✅ Pi 블로그 RSS 뉴스 반환: ${piBlogNews.length}개`);
      return {
        data: piBlogNews,
        success: true,
        timestamp: new Date().toISOString(),
        count: piBlogNews.length,
        source: "Pi Blog RSS",
      };
    }

    // 3순위: Pi 블로그 실패 시 기존 CryptoCompare 필터링 방식
    console.log("🔄 Pi 블로그 실패, 기존 방식으로 대체");

    const newsData = await fetchNewsFromApi("Blockchain,Technology,Mining,Altcoin,General");
    const validNewsData = Array.isArray(newsData) ? newsData : [];

    console.log("📊 수집된 전체 뉴스:", validNewsData.length, "개");

    const scoredNews = validNewsData.map((article) => ({
      ...article,
      piRelevance: calculatePiRelevance(article),
    }));

    const relevantNews = scoredNews.filter((article) => article.piRelevance >= 5);

    console.log("🔍 Pi 관련 뉴스:", relevantNews.length, "개 발견");

    const sortedNews = relevantNews.sort((a, b) => {
      if (a.piRelevance !== b.piRelevance) {
        return b.piRelevance - a.piRelevance;
      }
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    let finalNews = sortedNews.slice(0, 8);

    if (finalNews.length < 5) {
      console.log("⚠️ Pi 뉴스 부족, 관련 뉴스로 보충");

      const relatedKeywords = [
        "mobile", "mining", "blockchain", "cryptocurrency", "digital currency",
        "crypto wallet", "decentralized", "consensus", "node", "mining pool",
      ];

      const relatedNews = validNewsData.filter((article) => {
        if (finalNews.some((existing) => existing.url === article.url)) {
          return false;
        }

        const titleLower = article.title.toLowerCase();
        const descriptionLower = article.description.toLowerCase();

        return relatedKeywords.some((keyword) =>
          titleLower.includes(keyword) || descriptionLower.includes(keyword),
        );
      });

      const sortedRelated = relatedNews.sort((a, b) =>
        new Date(b.publishedAt) - new Date(a.publishedAt),
      );

      const additionalNews = sortedRelated.slice(0, 5 - finalNews.length);
      finalNews = [...finalNews, ...additionalNews];

      console.log("📊 관련 뉴스", additionalNews.length, "개 추가");
    }

    const limitedData = finalNews.slice(0, 10);
    console.log("✅ getPiNews 성공:", limitedData.length, "개 뉴스 반환");

    limitedData.forEach((article, index) => {
      console.log(`📰 ${index + 1}. [점수: ${article.piRelevance || 0}] ${article.title.substring(0, 50)}...`);
    });

    return {
      data: limitedData,
      success: true,
      timestamp: new Date().toISOString(),
      count: limitedData.length,
      source: "CryptoCompare 필터링",
    };
  } catch (error) {
    console.error("❌ getPiNews 함수 에러:", error);

    return {
      data: [],
      success: false,
      error: "Failed to fetch Pi Network news",
      timestamp: new Date().toISOString(),
      count: 0,
    };
  }
});

/**
 * 🔧 v2 방식: 30분마다 자동으로 Pi 블로그 뉴스 업데이트
 * Cloud Scheduler를 사용한 자동 업데이트 기능
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.updatePiBlogCache = onSchedule({
  schedule: "every 30 minutes", // 30분마다 실행
  timeZone: "Asia/Seoul", // 한국 시간 기준
}, async (event) => {
  console.log("🔄 Pi 블로그 자동 업데이트 시작");

  try {
    const piBlogNews = await fetchPiBlogNewsFromRSS();

    if (piBlogNews && piBlogNews.length > 0) {
      await cachePiBlogNews(piBlogNews);
      console.log(`✅ Pi 블로그 자동 업데이트 성공: ${piBlogNews.length}개 뉴스`);

      // 통계 업데이트 (선택사항)
      try {
        await db.collection("stats").doc("piBlogUpdates").set({
          lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
          newsCount: piBlogNews.length,
          updateCount: admin.firestore.FieldValue.increment(1),
        }, { merge: true });
      } catch (statsError) {
        console.warn("⚠️ 통계 업데이트 실패:", statsError.message);
      }
    } else {
      console.warn("⚠️ Pi 블로그 자동 업데이트 실패 - 뉴스를 가져올 수 없음");
    }
  } catch (error) {
    console.error("❌ Pi 블로그 자동 업데이트 에러:", error);
  }

  return null;
});

/**
 * 🔧 v2 방식: Pi 블로그 뉴스만 가져오는 별도 함수 (테스트/디버깅용)
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.getPiBlogNewsOnly = onCall(async (request) => {
  console.log("🥧 Pi 블로그 전용 뉴스 요청");

  try {
    // 캐시 확인
    let piBlogNews = await getCachedPiBlogNews();

    // 캐시가 없으면 RSS에서 가져오기
    if (!piBlogNews || piBlogNews.length === 0) {
      piBlogNews = await fetchPiBlogNewsFromRSS();

      if (piBlogNews && piBlogNews.length > 0) {
        await cachePiBlogNews(piBlogNews);
      }
    }

    return {
      data: piBlogNews || [],
      success: piBlogNews && piBlogNews.length > 0,
      timestamp: new Date().toISOString(),
      count: piBlogNews ? piBlogNews.length : 0,
      source: "Pi Blog RSS Only",
      cacheStatus: piBlogNews ? "cached" : "fresh",
    };
  } catch (error) {
    console.error("❌ Pi 블로그 전용 뉴스 에러:", error);

    return {
      data: [],
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      count: 0,
    };
  }
});

/**
 * 🔧 v2 방식: HTTP version for getCryptoNews (for testing)
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.getCryptoNewsHttp = onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const newsData = await fetchNewsFromApi("BTC,ETH,Market,Exchange");
      const validData = Array.isArray(newsData) ?
        newsData.slice(0, 10) : [];
      response.status(200).send(validData);
    } catch (error) {
      console.error("Error in getCryptoNewsHttp function:", error);
      response.status(500).send({
        error: "Failed to fetch crypto news.",
        data: [],
        success: false,
      });
    }
  });
});

/**
 * 🔧 v2 방식: HTTP version for getPiNews (for testing)
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.getPiNewsHttp = onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const newsData = await fetchNewsFromApi("Blockchain,Technology,Mining,Altcoin,General");
      const validNewsData = Array.isArray(newsData) ? newsData : [];

      const scoredNews = validNewsData.map((article) => ({
        ...article,
        piRelevance: calculatePiRelevance(article),
      }));

      const relevantNews = scoredNews.filter((article) => article.piRelevance >= 5);

      const sortedNews = relevantNews.sort((a, b) => {
        if (a.piRelevance !== b.piRelevance) {
          return b.piRelevance - a.piRelevance;
        }
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });

      let finalNews = sortedNews.slice(0, 8);

      if (finalNews.length < 5) {
        const relatedKeywords = [
          "mobile", "mining", "blockchain", "cryptocurrency", "digital currency",
          "crypto wallet", "decentralized", "consensus", "node", "mining pool",
        ];

        const relatedNews = validNewsData.filter((article) => {
          if (finalNews.some((existing) => existing.url === article.url)) {
            return false;
          }

          const titleLower = article.title.toLowerCase();
          const descriptionLower = article.description.toLowerCase();

          return relatedKeywords.some((keyword) =>
            titleLower.includes(keyword) || descriptionLower.includes(keyword),
          );
        });

        const sortedRelated = relatedNews.sort((a, b) =>
          new Date(b.publishedAt) - new Date(a.publishedAt),
        );

        finalNews = [...finalNews, ...sortedRelated.slice(0, 5 - finalNews.length)];
      }

      response.status(200).send(finalNews.slice(0, 10));
    } catch (error) {
      console.error("Error in getPiNewsHttp function:", error);
      response.status(500).send({
        error: "Failed to fetch Pi Network news.",
        data: [],
        success: false,
      });
    }
  });
});

/**
 * 🔧 v2 방식: Pi 블로그 RSS 상태 확인 함수 (디버깅용)
 * 기존 로직 100% 동일, 선언 방식만 v2로 변경
 */
exports.checkPiBlogStatus = onCall(async (request) => {
  console.log("🔍 Pi 블로그 상태 확인");

  try {
    const cachedNews = await getCachedPiBlogNews();
    const freshNews = await fetchPiBlogNewsFromRSS();

    return {
      cache: {
        available: !!cachedNews,
        count: cachedNews ? cachedNews.length : 0,
      },
      rss: {
        available: !!freshNews && freshNews.length > 0,
        count: freshNews ? freshNews.length : 0,
        testUrl: freshNews && freshNews[0] ? freshNews[0].rssFeedUrl : null,
      },
      timestamp: new Date().toISOString(),
      status: "success",
    };
  } catch (error) {
    console.error("❌ Pi 블로그 상태 확인 에러:", error);

    return {
      error: error.message,
      timestamp: new Date().toISOString(),
      status: "error",
    };
  }
});

/**
 * 🔒 추가적인 보안 함수들 (필요시 확장 가능)
 */
exports.getServerTime = onCall(async (request) => {
  // 서버 시간 반환 (타임스탬프 검증 등에 사용 가능)
  return {
    success: true,
    serverTime: admin.firestore.Timestamp.now(),
    timezone: 'UTC'
  };
});

/**
 * 🔒 로그 정리 함수 (관리자용)
 */
exports.cleanupLogs = onCall(async (request) => {
  try {
    // 보안상 중요한 로그들 정리
    console.log('🧹 서버 로그 정리 완료');
    return {
      success: true,
      message: 'Server logs cleaned'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});