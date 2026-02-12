
// Common
#define PI 3.1415926

#define NUM_METEORS 60
#define SPEED_MIN 1.5       // 속도를 조금 더 빠르게
#define SPEED_VAR 0.9
#define TRAIL_LEN 0.7       // 꼬리 길이를 훨씬 길게 수정 (기존 0.15 -> 0.4)
#define ANGLE - 0.8          // 각도 약간 수정

// --- 랜덤 함수들 ---
float hash11(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

vec2 hash21(float p) {
	vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

// 새로 추가: vec3 출력을 위한 해시 함수 (랜덤 색상용)
vec3 hash31(float p) {
   vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

// Buffer A: 입자 위치, 속도, 크기 + 인터랙션

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    if (fragCoord.y > 1.0 || fragCoord.x >= float(NUM_METEORS)) { discard; }

    float id = fragCoord.x;
    vec4 data = texelFetch(iChannel0, ivec2(fragCoord), 0);
    vec2 pos = data.xy;
    float speed = data.z;
    float size = data.w;

    // 리셋 조건
    bool reset = (iFrame == 0) || (pos.y < -0.5) || (pos.x < -0.5 && pos.y < 0.5);

    if (reset) {
        float seed = iTime + id * 12.34;
        vec2 r = hash21(seed);
        pos.x = r.x * 4.0 - 2.0;
        pos.y = 1.5 + r.y * 2.0;

        speed = SPEED_MIN + r.y * SPEED_VAR;
        size = 0.5 + hash11(seed * 7.7) * 0.5;
    }
    else {
        // 1. 기본 이동 (중력/바람)
        vec2 dir = vec2(sin(ANGLE), cos(ANGLE));
        pos += dir * speed * -1.0 * iTimeDelta;

        // 2. [인터랙션] 마우스 회피 로직
        // iMouse.z > 0.0은 마우스를 클릭 중일 때만 작동
        if (iMouse.z > 0.0) {
            // 마우스 좌표를 UV 좌표계로 변환 (Image탭과 비율 맞춤)
            vec2 mouseUV = iMouse.xy / iResolution.y;

            // 유성과 마우스 사이의 벡터 계산
            vec2 toMeteor = pos - mouseUV;
            float dist = length(toMeteor);

            // 영향 범위 (반지름 0.3)
            float radius = 0.3;

            if (dist < radius) {
                // 거리가 가까울수록 더 강하게 밀어냄
                float force = (1.0 - dist / radius);

                // 밀어내는 힘 적용 (부드럽게 밀리도록 0.05 계수 사용)
                pos += normalize(toMeteor) * 0.05 * force;
            }
        }
    }

    fragColor = vec4(pos, speed, size);
}


// Buffer B: 입자 색상 + 인터랙션

vec3 hueShift(vec3 color, float shift) {
    vec3 P = vec3(0.55735) * dot(vec3(0.55735), color);
    vec3 U = color - P;
    vec3 V = cross(vec3(0.55735), U);
    return U * cos(shift * 6.2832) + V * sin(shift * 6.2832) + P;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    if (fragCoord.y > 1.0 || fragCoord.x >= float(NUM_METEORS)) { discard; }

    float id = fragCoord.x;

    // 현재 유성의 위치 정보를 Buffer A에서 가져옴 (인터랙션 거리 계산용)
    vec4 dataA = texelFetch(iChannel1, ivec2(fragCoord), 0);
    vec2 pos = dataA.xy;

    if (iFrame == 0) {
        float colorSeed = id * 45.67 + 89.12;
        vec3 baseColor = hash31(colorSeed);
        baseColor = normalize(baseColor + vec3(0.3, 0.4, 0.6));
        fragColor = vec4(baseColor, 1.0);
    }
    else {
        // 이전 색상 유지 및 회전
        vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0); // Buffer B 자기 자신
        vec3 nextColor = hueShift(prev.rgb, 0.001);

        // 마우스 근처일 때 색상 변경
        if (iMouse.z > 0.0) {
            vec2 mouseUV = iMouse.xy / iResolution.y;
            float dist = distance(pos, mouseUV);

            // 영향 범위 안이라면
            if (dist < 0.3) {
                // 중심에 가까울수록 "붉은색+흰색(Hot Color)"으로 변환
                float intensity = (1.0 - dist / 0.3);
                // 기존 색상과 붉은색(vec3(1.0, 0.2, 0.1))을 섞음
                nextColor = mix(nextColor, vec3(1.0, 0.3, 0.1), intensity * 0.5);
                // 밝기 증가
                nextColor += vec3(0.1) * intensity;
            }
        }

        fragColor = vec4(nextColor, 1.0);
    }
}

// Buffer C: HDR 렌더링 (배경 + 유성우)

// --- [배경용 설정 및 함수] ---
#define NS 100.
// 구름(성운)의 밝기 강도
#define CI 0.07 

float N21(vec2 p) {
    return fract(sin(p.x * 100. + p.y * 7446.) * 8345.);
}

float SS(vec2 uv) {
    vec2 lv = fract(uv);
    lv = lv * lv * (3. - 2. * lv);
    vec2 id = floor(uv);
    
    float bl = N21(id);
    float br = N21(id + vec2(1., 0.));
    float b = mix(bl, br, lv.x);

    float tl = N21(id + vec2(0., 1.));
    float tr = N21(id + vec2(1., 1.));
    float t = mix(tl, tr, lv.x);

    return mix(b, t, lv.y);
}

float L(vec2 uv, vec2 ofs, float b, float l) {
    // [미세수정] 배경 별의 밝기도 약간 낮춤 (1000. -> 800.)
    return smoothstep(0., 800., b * max(0.1, l) / pow(max(0.0000000000001, length(uv - ofs)), 1. / max(0.1, l)));
}

float rand(vec2 co, float s){
    float PHI = 1.61803398874989484820459;
    return fract(tan(distance(co * PHI, co) * s) * co.x);
}

vec2 H12(float s) {
    float x = rand(vec2(243.234, 63.834), s) - .5;
    float y = rand(vec2(53.1434, 13.1234), s) - .5;
    return vec2(x, y);
}
// --- [배경용 설정 끝] ---


// --- [유성우용 함수] ---
mat2 Rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

float Star(vec2 uv, float flare)
{
    float d = length(uv);
    float m = .05 / d;
    float rays = max(0., 1. - abs(uv.x * uv.y * 75.0));
    m += rays * 2.0 * flare;
    m *= smoothstep(1.2, 0.1, d);
    return m;
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b)
{
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) * 1.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // ------------------------------------------------
    // 1. 배경 그리기 (어둡게 수정됨)
    // ------------------------------------------------
    vec2 bgUV = fragCoord / iResolution.xy;
    bgUV -= .5;
    bgUV.x *= iResolution.x / iResolution.y;
    
    vec4 bgCol = vec4(.0);

    // [수정] 배경 베이스 색상을 훨씬 어둡게 변경
    // 기존 색상 대비 밝기를 약 30~40% 수준으로 낮춤
vec4 b = vec4(0.001, 0.005, 0.02, 1.0);  // 거의 검은색에 가까운 남색
vec4 p = vec4(0.01, 0.005, 0.01, 1.0);   // 아주 희미한 보라색
vec4 lb = vec4(0.01, 0.02, 0.04, 1.0);   // 아주 희미한 파란색
    
    vec4 blb = mix(b, lb, -bgUV.x * .2 - (bgUV.y * .5));
    bgCol += mix(blb, p, bgUV.x - (bgUV.y * 1.5));

    // 배경 별 그리기
    for (float i = 0.; i < NS; i++) {
        vec2 ofs = H12(i + 1.);
        ofs *= vec2(1.8, 1.1);
        float r = (mod(i, 20.) == 0.) ? 0.5 + abs(sin(i / 50.)) : 0.25;
        bgCol += vec4(L(bgUV, ofs, r + (sin(fract(iTime) * .5 * i) + 1.) * 0.02, 1.));
    }

    // 배경 구름/노이즈 이동
    vec2 cloudUV = bgUV;
    cloudUV.x += iTime * .03;
    cloudUV.y += sin(iTime * .03);
    
    float c = 0.;
    for (float i = 1.; i < 8.; i += 1.) {
        c += SS(cloudUV * pow(2., i)) * pow(0.5, i);
    }
    // 상단에서 정의한 낮아진 CI값 적용
    bgCol = bgCol + c * CI;

    // ------------------------------------------------
    // 2. 유성우 합성하기 (기존 동일)
    // ------------------------------------------------
    
    vec3 col = bgCol.rgb;
    vec2 uv = fragCoord / iResolution.y;

    for (int i = 0; i < NUM_METEORS; i++) {
        ivec2 dataCoord = ivec2(i, 0);
        vec4 dataA = texelFetch(iChannel0, dataCoord, 0);
        vec3 meteorColor = texelFetch(iChannel1, dataCoord, 0).rgb;

        vec2 pos = dataA.xy;
        float speed = dataA.z;
        float size = dataA.w;
        
        vec2 head = pos;
        vec2 dir = vec2(sin(ANGLE), cos(ANGLE)); 
        vec2 tail = pos - dir * (-1.0) * TRAIL_LEN * speed;

        // --- Trail ---
        vec2 pa = uv - head;
        vec2 ba = tail - head;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float dTrail = sdSegment(uv, head, tail);
        
        vec3 finalTrailColor = mix(vec3(0.95, 0.95, 1.2), meteorColor, pow(h, 0.5));
        float core = exp(-dTrail * 250.0 / size) * 2.0; 
        float glow = exp(-dTrail * 40.0 / size) * 0.3;
        float fade = pow(1.0 - h, 4.0);

        col += finalTrailColor * (core + glow) * fade * 0.8;

        // --- Head ---
        vec2 headUV = uv - head;
        headUV *= 45.0 / size; 
        float rotSpeed = iTime * (3.0 + speed);
        headUV *= Rot(rotSpeed * 0.6);        
        float starLight = Star(headUV, 200.5);
        vec3 headColor = mix(meteorColor, vec3(1.0), 0.7);

        col += headColor * starLight * 0.008;
    }

    fragColor = vec4(col, 1.0);
}

// Buffer D: 가우시안 블러 (Bloom 효과 생성)

const int RADIUS = 4;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 pixelSize = 1.0 / iResolution.xy;
    vec3 sum = vec3(0.0);
    float totalWeight = 0.0;

    // 단순화된 가우시안 블러
    for (int x = -RADIUS; x <= RADIUS; x++) {
        for (int y = -RADIUS; y <= RADIUS; y++) {
            vec2 offset = vec2(float(x), float(y)) * pixelSize * 2.0;

            // 중심에서 멀어질수록 가중치 감소 (Gaussian weight approximation)
            float weight = exp(-(float(x * x + y * y)) / (2.0 * float(RADIUS)));

            sum += texture(iChannel0, fragCoord / iResolution.xy + offset).rgb * weight;
            totalWeight += weight;
        }
    }

    fragColor = vec4(sum / totalWeight, 1.0);
}

// reference: https://www.shadertoy.com/view/tlyGW3
// reference: https://www.shadertoy.com/view/fsSfD3

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // 1. 원본 HDR 이미지 (Buffer C)
    vec3 original = texture(iChannel0, uv).rgb;

    // 2. 블러링된 이미지 (Buffer D)
    vec3 bloom = texture(iChannel1, uv).rgb;

    // 3. 합성 (Additive Blending)
    vec3 col = original + bloom * 0.6;

    // 4. 최종 
    col = tanh(col);                 // tone-mapping
    col = pow(col, vec3(0.4545));  // gamma-correction

    fragColor = vec4(col, 1.0);
}