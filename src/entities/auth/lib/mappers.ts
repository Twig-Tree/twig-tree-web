import type { MemberDTO } from "../api/types";
import type { Member } from "../model/types";

export const mapMemberDtoToDomain = (dto: MemberDTO): Member => ({
  id: String(dto.memberId),
  email: dto.email,
  name: dto.name,
  profileImage: dto.profileImage,
});
