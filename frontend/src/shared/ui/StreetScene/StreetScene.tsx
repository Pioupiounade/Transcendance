import styles from './StreetScene.module.css';

// Illustration de la maquette (`mockup/index.html`, page auth), recolorée pour la refonte (gris, pastels, citron) : une rue de quartier, ses immeubles,
// ses commerces, son square et ses voisins. Décorative (aria-hidden), ancrée en bas et recadrée par `slice` ;
// l'hôte fixe la hauteur. Partagée par les pages d'auth et la landing.
export function StreetScene() {
  return (
    <svg className={styles.scene} viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FAFAFA" />
          <stop offset="1" stopColor="#EEF5F7" />
        </linearGradient>
        <pattern
          id="scene-win"
          width="44"
          height="52"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="12"
            y="12"
            width="20"
            height="28"
            rx="3"
            fill="#fff"
            opacity=".7"
          />
        </pattern>
      </defs>
      <rect width="1440" height="400" fill="url(#scene-sky)" />
      <circle cx="1210" cy="92" r="44" fill="#FFF04D" opacity=".85" />

      {/* immeubles, côté gauche */}
      <g>
        <rect x="20" y="140" width="110" height="190" fill="#DCE7E9" />
        <rect x="16" y="134" width="118" height="8" rx="2" fill="#D9D9D9" />
        <rect x="28" y="156" width="94" height="130" fill="url(#scene-win)" />
        <rect x="62" y="296" width="26" height="34" rx="2" fill="#1C1C1C" />
        <rect x="134" y="80" width="150" height="250" fill="#F2F2F2" />
        <rect x="130" y="74" width="158" height="8" rx="2" fill="#D9D9D9" />
        <rect x="142" y="96" width="134" height="180" fill="url(#scene-win)" />
        <rect x="134" y="284" width="150" height="12" fill="#FFF04D" />
        <rect
          x="150"
          y="300"
          width="118"
          height="30"
          rx="2"
          fill="#FFFFFF"
        />
        <rect x="196" y="300" width="26" height="30" fill="#1C1C1C" />
        <rect x="288" y="120" width="120" height="210" fill="#EAE8F7" />
        <rect
          x="284"
          y="114"
          width="128"
          height="8"
          rx="2"
          fill="#C9C9C9"
        />
        <rect x="296" y="136" width="104" height="150" fill="url(#scene-win)" />
        <rect
          x="336"
          y="296"
          width="26"
          height="34"
          rx="2"
          fill="#1C1C1C"
        />
        <rect x="412" y="60" width="140" height="270" fill="#F5F5F5" />
        <rect x="408" y="54" width="148" height="8" rx="2" fill="#C9C9C9" />
        <rect x="420" y="76" width="124" height="200" fill="url(#scene-win)" />
        <rect
          x="470"
          y="296"
          width="26"
          height="34"
          rx="2"
          fill="#1C1C1C"
        />
      </g>

      {/* le square, au centre */}
      <g>
        <rect x="560" y="322" width="330" height="8" fill="#DCE7E9" />
        <rect x="636" y="290" width="8" height="40" fill="#3A3A3A" />
        <circle cx="640" cy="250" r="48" fill="#BCCFD3" />
        <rect x="756" y="286" width="9" height="44" fill="#3A3A3A" />
        <circle cx="760" cy="232" r="60" fill="#9DB5BB" />
        <rect x="838" y="298" width="7" height="32" fill="#3A3A3A" />
        <circle cx="841" cy="272" r="34" fill="#D2CEEC" />
        <rect x="688" y="302" width="60" height="6" rx="2" fill="#3A3A3A" />
        <rect x="692" y="308" width="5" height="22" fill="#3A3A3A" />
        <rect x="739" y="308" width="5" height="22" fill="#3A3A3A" />
        <rect x="866" y="222" width="4" height="108" fill="#444" />
        <circle
          cx="868"
          cy="216"
          r="9"
          fill="#FFF04D"
          stroke="#444"
          strokeWidth="2"
        />
        {/* des voisins */}
        <circle cx="600" cy="290" r="9" fill="#C99A7A" />
        <rect
          x="590"
          y="300"
          width="20"
          height="30"
          rx="8"
          fill="#FFF04D"
        />
        <circle cx="712" cy="286" r="9" fill="#8C6A54" />
        <rect
          x="702"
          y="296"
          width="20"
          height="26"
          rx="8"
          fill="#46407A"
        />
        <circle cx="812" cy="292" r="8" fill="#E2B79B" />
        <rect x="803" y="301" width="18" height="29" rx="8" fill="#222" />
      </g>

      {/* immeubles, côté droit */}
      <g>
        <rect x="890" y="100" width="130" height="230" fill="#EAE8F7" />
        <rect x="886" y="94" width="138" height="8" rx="2" fill="#D9D9D9" />
        <rect x="898" y="116" width="114" height="160" fill="url(#scene-win)" />
        <rect
          x="942"
          y="296"
          width="26"
          height="34"
          rx="2"
          fill="#1C1C1C"
        />
        <rect x="1024" y="50" width="160" height="280" fill="#DCE9EE" />
        <rect
          x="1020"
          y="44"
          width="168"
          height="8"
          rx="2"
          fill="#C4C4C4"
        />
        <rect x="1032" y="66" width="144" height="210" fill="url(#scene-win)" />
        <rect x="1024" y="284" width="160" height="12" fill="#FFF04D" />
        <rect
          x="1040"
          y="300"
          width="128"
          height="30"
          rx="2"
          fill="#FFFFFF"
        />
        <rect x="1090" y="300" width="26" height="30" fill="#1C1C1C" />
        <rect x="1188" y="130" width="120" height="200" fill="#FFFFFF" />
        <rect
          x="1184"
          y="124"
          width="128"
          height="8"
          rx="2"
          fill="#D9D9D9"
        />
        <rect x="1196" y="146" width="104" height="140" fill="url(#scene-win)" />
        <rect
          x="1236"
          y="296"
          width="26"
          height="34"
          rx="2"
          fill="#1C1C1C"
        />
        <rect x="1312" y="80" width="128" height="250" fill="#F2F2F2" />
        <rect
          x="1308"
          y="74"
          width="136"
          height="8"
          rx="2"
          fill="#C9C9C9"
        />
        <rect x="1320" y="96" width="112" height="180" fill="url(#scene-win)" />
        <rect
          x="1364"
          y="296"
          width="26"
          height="34"
          rx="2"
          fill="#1C1C1C"
        />
        {/* un vélo contre le mur */}
        <g
          fill="none"
          stroke="#444"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <circle cx="958" cy="316" r="13" />
          <circle cx="996" cy="316" r="13" />
          <path d="M958 316l12-22h18l8 22M970 294h-8M988 294l4-8h8" />
        </g>
      </g>

      {/* trottoir */}
      <rect y="330" width="1440" height="70" fill="#ECECEC" />
      <rect y="330" width="1440" height="6" fill="#DCDCDC" />
    </svg>
  );
}
