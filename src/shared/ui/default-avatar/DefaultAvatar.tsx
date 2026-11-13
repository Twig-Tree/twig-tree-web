interface DefaultAvatarProps {
  className?: string; // 크기와 hover처럼 쓰는 곳마다 다른 스타일
}

/*
함수 이름 : DefaultAvatar
기능 : 프로필 사진이 없을 때 쓰는 기본 프로필 사진을 그린다. 회색 원 바탕에 사람 실루엣을 그린다.
인자 : DefaultAvatarProps
반환값 : 기본 프로필 사진. 장식이므로 보조 기술에는 숨기고, 이름은 감싸는 버튼이 갖는다
*/
export function DefaultAvatar({ className = "" }: DefaultAvatarProps) {
  /*
  원 모양은 바깥 span이 잘라 낸다. 어깨가 원 아래로 넘치게 그려야 실루엣이 원 테두리에 닿는다.
  */
  return (
    <span
      className={`block overflow-hidden rounded-full bg-surface-strong text-content-muted ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-full w-full" fill="currentColor">
        <circle cx="16" cy="12.5" r="5.5" />
        <ellipse cx="16" cy="29" rx="10.5" ry="8.5" />
      </svg>
    </span>
  );
}
