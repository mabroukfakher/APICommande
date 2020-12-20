import LocalService from "./local";

class AssetsService {
  getFileData(path, fileName) {
    return LocalService.getFileData(path, fileName);
  }

  getFilesData(path, files) {
    return LocalService.getFilesData(path, files);
  }

  getFiles(path) {
    return LocalService.getFiles(path);
  }

  deleteFile(path, fileName) {
    return LocalService.deleteFile(path, fileName);
  }

  deleteDir(path) {
    return LocalService.deleteDir(path);
  }

  emptyDir(path) {
    return LocalService.emptyDir(path);
  }

  uploadFile(req, res, path, onUploadEnd) {
    return LocalService.uploadFile(req, res, path, onUploadEnd);
  }
  uploadFileCSV(req, res, path, onUploadEnd) {
    return LocalService.uploadFileCSV(req, res, path, onUploadEnd);
  }
  uploadFileConversation(req, res, path, onUploadEnd) {
    return LocalService.uploadFileConversation(req, res, path, onUploadEnd);
  }
  uploadFiles(req, res, path, onFileUpload, onFilesEnd) {
    return LocalService.uploadFiles(req, res, path, onFileUpload, onFilesEnd);
  }
}

export default new AssetsService();
