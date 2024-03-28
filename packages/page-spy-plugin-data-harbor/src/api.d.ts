declare namespace H {
  export type UploadResult = {
    code: string;
    data: {
      name: string;
      fileId: string;
      size: number;
    };
    success: boolean;
    message: string;
  };
}

interface Window {
  $pageSpy: any;
  PageSpy: any;
}
