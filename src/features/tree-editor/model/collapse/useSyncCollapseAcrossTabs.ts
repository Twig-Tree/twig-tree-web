import { useEffect } from "react";
import { getExternalCollapsedServerIds } from "../../lib/collapse/getExternalCollapsedServerIds";
import { useCollapseStore } from "./collapseStore";

/*
함수 이름 : useSyncCollapseAcrossTabs
기능 : 같은 트리를 연 다른 탭이 접힘 목록을 저장하면 storage 이벤트로 받아 이 탭의 접힘 집합을 교체한다. 탭마다 접힘 집합을 메모리에 들고 있고 저장할 때 집합 전체를 덮어쓰므로, 받지 않으면 두 탭이 서로의 변경을 덮어쓴다.
인자 : 없음
반환값 : 없음
*/
export const useSyncCollapseAcrossTabs = () => {
  useEffect(() => {
    /*
    storage 이벤트는 같은 출처의 다른 탭이 localStorage를 바꿨을 때만 발생하므로, 이 탭이 저장한 값이 되돌아오지 않는다.
    이벤트가 어느 트리의 것인지는 페이지의 treeId가 아니라 접힘 store의 treeId로 판단한다. 복원 전이면 받을 집합이 없다.
    */
    const handleStorage = (event: StorageEvent) => {
      const { treeId, applyExternalCollapse } = useCollapseStore.getState();

      const serverIds = getExternalCollapsedServerIds({
        key: event.key,
        newValue: event.newValue,
        treeId,
      });

      if (serverIds === null) return;

      applyExternalCollapse(serverIds);
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);
};
