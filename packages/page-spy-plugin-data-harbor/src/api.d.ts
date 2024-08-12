declare namespace H {
  interface SingleLog {
    name: string;
    fileId: string;
    size: number;
  }

  interface GroupLog extends SingleLog {
    groupId: string;
    tags: {
      createdAt: string;
      updatedAt: string;
      key: string;
      value: string;
    }[];
  }

  export type UploadResult<T = SingleLog | GroupLog> = {
    code: string;
    data: T;
    success: boolean;
    message: string;
  };
}

interface Window {
  $pageSpy: any;
  PageSpy: any;
}
