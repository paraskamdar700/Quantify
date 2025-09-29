import fs from 'fs';


const cleanUpFiles = (paths = []) => {
  paths.forEach((filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

export { cleanUpFiles };