"use client";

import { useState } from "react";
import type { FolderItem } from "@/src/entities/folder";
import type { BreadcrumbItem } from "@/src/shared/ui/breadcrumb";

const ROOT_LABEL = "Root";

export interface FolderPathEntry {
  id: string; // 폴더 ID
  name: string; // breadcrumb에 표시할 폴더 이름
}

/*
함수 이름 : useFolderPath
기능 : 루트에서부터 따라 내려간 폴더 경로를 스택으로 관리하고, 현재 위치와 breadcrumb 항목을 제공한다.
인자 : 없음
반환값 : 현재 폴더 ID, breadcrumb 항목, 경로 이동 handler

경로는 사용자가 밟은 순서 그대로이므로 조상 조회 API 없이 화면에서 구성한다.
루트는 스택이 비어 있는 상태로 표현해, 현재 폴더 ID가 자연스럽게 null이 된다.
*/
export function useFolderPath() {
  const [path, setPath] = useState<FolderPathEntry[]>([]);

  const currentFolderId = path.at(-1)?.id ?? null;
  const hasParentFolder = path.length > 0;

  /*
  함수 이름 : handleGoToDepth
  기능 : 경로를 앞에서부터 depth개만 남겨 해당 위치로 이동한다.
  인자 : number depth -> 남길 경로 길이. 0이면 루트
  반환값 : 없음
  */
  const handleGoToDepth = (depth: number) => {
    setPath((current) => current.slice(0, depth));
  };

  /*
  함수 이름 : handleEnterFolder
  기능 : 선택한 폴더를 경로 끝에 쌓아 한 단계 아래로 이동한다.
  인자 : FolderItem folder -> 목록에서 선택한 폴더
  반환값 : 없음
  */
  const handleEnterFolder = (folder: FolderItem) => {
    const { id, name } = folder;

    setPath((current) => [...current, { id, name }]);
  };

  /*
  함수 이름 : handleGoToParentFolder
  기능 : 경로의 마지막 폴더를 걷어내 한 단계 위로 이동한다.
  인자 : 없음
  반환값 : 없음
  */
  const handleGoToParentFolder = () => {
    setPath((current) => current.slice(0, -1));
  };

  /*
  마지막 항목은 현재 위치이므로 이동 handler를 붙이지 않는다.
  Breadcrumb은 href와 onClick이 모두 없는 항목을 현재 위치로 표시한다.
  */
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: ROOT_LABEL,
      onClick: hasParentFolder ? () => handleGoToDepth(0) : undefined,
    },
    ...path.map((entry, index) => ({
      label: entry.name,
      onClick:
        index < path.length - 1 ? () => handleGoToDepth(index + 1) : undefined,
    })),
  ];

  return {
    breadcrumbItems,
    currentFolderId,
    handleEnterFolder,
    handleGoToParentFolder,
    hasParentFolder,
  };
}
