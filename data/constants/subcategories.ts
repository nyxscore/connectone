// 악기 하위 카테고리 데이터
export const INSTRUMENT_SUBCATEGORIES = {
  // 건반악기
  건반: [
    { key: "piano", label: "피아노", icon: "🎹" },
    { key: "digital_piano", label: "디지털피아노", icon: "🎹" },
    { key: "organ", label: "오르간", icon: "🎹" },
    { key: "synthesizer", label: "신디사이저", icon: "🎛️" },
    { key: "keyboard", label: "키보드", icon: "🎹" },
    { key: "electric_piano", label: "전자피아노", icon: "🎹" },
    { key: "accordion", label: "아코디언", icon: "🎵" },
    { key: "harmonium", label: "하모니움", icon: "🎵" },
  ],

  // 현악기
  현악: [
    { key: "guitar", label: "기타", icon: "🎸" },
    { key: "acoustic_guitar", label: "어쿠스틱기타", icon: "🎸" },
    { key: "electric_guitar", label: "일렉기타", icon: "🎸" },
    { key: "classical_guitar", label: "클래식기타", icon: "🎸" },
    { key: "bass_guitar", label: "베이스기타", icon: "🎸" },
    { key: "violin", label: "바이올린", icon: "🎻" },
    { key: "viola", label: "비올라", icon: "🎻" },
    { key: "cello", label: "첼로", icon: "🎻" },
    { key: "double_bass", label: "콘트라베이스", icon: "🎻" },
    { key: "harp", label: "하프", icon: "🎼" },
    { key: "mandolin", label: "만돌린", icon: "🎸" },
    { key: "banjo", label: "밴조", icon: "🎸" },
    { key: "ukulele", label: "우쿨렐레", icon: "🎸" },
  ],

  // 관악기
  관악: [
    { key: "flute", label: "플루트", icon: "🎺" },
    { key: "piccolo", label: "피콜로", icon: "🎺" },
    { key: "clarinet", label: "클라리넷", icon: "🎺" },
    { key: "oboe", label: "오보에", icon: "🎺" },
    { key: "english_horn", label: "잉글리시호른", icon: "🎺" },
    { key: "bassoon", label: "바순", icon: "🎺" },
    { key: "saxophone", label: "색소폰", icon: "🎷" },
    { key: "alto_sax", label: "알토색소폰", icon: "🎷" },
    { key: "tenor_sax", label: "테너색소폰", icon: "🎷" },
    { key: "baritone_sax", label: "바리톤색소폰", icon: "🎷" },
    { key: "trumpet", label: "트럼펫", icon: "🎺" },
    { key: "trombone", label: "트롬본", icon: "🎺" },
    { key: "french_horn", label: "프렌치호른", icon: "🎺" },
    { key: "tuba", label: "튜바", icon: "🎺" },
    { key: "recorder", label: "리코더", icon: "🎺" },
  ],

  // 타악기
  타악: [
    { key: "drum_set", label: "드럼세트", icon: "🥁" },
    { key: "cymbals", label: "심벌즈", icon: "🥁" },
    { key: "hi_hat", label: "하이햇심벌", icon: "🥁" },
    { key: "crash_cymbal", label: "크래시심벌", icon: "🥁" },
    { key: "ride_cymbal", label: "라이드심벌", icon: "🥁" },
    { key: "snare_drum", label: "스네어드럼", icon: "🥁" },
    { key: "bass_drum", label: "베이스드럼", icon: "🥁" },
    { key: "tom_tom", label: "톰톰", icon: "🥁" },
    { key: "timpani", label: "팀파니", icon: "🥁" },
    { key: "xylophone", label: "실로폰", icon: "🎵" },
    { key: "marimba", label: "마림바", icon: "🎵" },
    { key: "vibraphone", label: "비브라폰", icon: "🎵" },
    { key: "gong", label: "징", icon: "🥁" },
    { key: "triangle", label: "트라이앵글", icon: "🔺" },
    { key: "tambourine", label: "탬버린", icon: "🥁" },
  ],

  // 국악기
  국악: [
    { key: "gayageum", label: "가야금", icon: "🎵" },
    { key: "geomungo", label: "거문고", icon: "🎵" },
    { key: "haegeum", label: "해금", icon: "🎻" },
    { key: "ajaeng", label: "아쟁", icon: "🎻" },
    { key: "daegeum", label: "대금", icon: "🎺" },
    { key: "sogeum", label: "소금", icon: "🎺" },
    { key: "piri", label: "피리", icon: "🎺" },
    { key: "taepyeongso", label: "태평소", icon: "🎺" },
    { key: "janggu", label: "장구", icon: "🥁" },
    { key: "buk", label: "북", icon: "🥁" },
    { key: "kwaenggwari", label: "꽹과리", icon: "🥁" },
    { key: "jing", label: "징", icon: "🥁" },
  ],

  // 음향기기
  음향: [
    { key: "microphone", label: "마이크", icon: "🎤" },
    { key: "mixer", label: "믹서", icon: "🎛️" },
    { key: "amplifier", label: "앰프", icon: "🔊" },
    { key: "speaker", label: "스피커", icon: "🔊" },
    { key: "headphone", label: "헤드폰", icon: "🎧" },
    { key: "monitor", label: "모니터", icon: "📺" },
    { key: "interface", label: "오디오인터페이스", icon: "🎛️" },
    { key: "recorder", label: "레코더", icon: "📼" },
    { key: "effects", label: "이펙터", icon: "🎛️" },
    { key: "cable", label: "케이블", icon: "🔌" },
  ],

  // 특수악기
  특수: [
    { key: "theremin", label: "테레민", icon: "🎵" },
    { key: "ondes_martenot", label: "온드마르트노", icon: "🎵" },
    { key: "glass_harmonica", label: "글라스하모니카", icon: "🎵" },
    { key: "hang_drum", label: "행드럼", icon: "🥁" },
    { key: "kalimba", label: "칼림바", icon: "🎵" },
    { key: "steel_drum", label: "스틸드럼", icon: "🥁" },
    { key: "didgeridoo", label: "디저리두", icon: "🎺" },
    { key: "shakuhachi", label: "샤쿠하치", icon: "🎺" },
  ],

  // 기타용품
  용품: [
    { key: "case", label: "케이스", icon: "💼" },
    { key: "stand", label: "스탠드", icon: "📐" },
    { key: "tuner", label: "튜너", icon: "🎵" },
    { key: "metronome", label: "메트로놈", icon: "⏱️" },
    { key: "sheet_music", label: "악보", icon: "📄" },
    { key: "strings", label: "현", icon: "🎸" },
    { key: "pick", label: "피크", icon: "🎸" },
    { key: "capo", label: "카포", icon: "🎸" },
    { key: "strap", label: "스트랩", icon: "🎸" },
    { key: "cleaning", label: "청소용품", icon: "🧽" },
    { key: "maintenance", label: "정비용품", icon: "🔧" },
    { key: "books", label: "교재", icon: "📚" },
  ],
};

// 검색을 위한 플랫 데이터
export const ALL_INSTRUMENTS = Object.values(INSTRUMENT_SUBCATEGORIES).flat();
