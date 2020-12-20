const getCorrectFileName = filename => {
  if (filename) {
    // replace unsafe characters
    return filename.replace(/[\s*/:;&?@$()<>#%\{\}|\\\^\~\[\]]/g, "-");
  }
  return filename;
};

export default {
  getCorrectFileName
};
