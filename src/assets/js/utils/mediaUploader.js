/**
 * mediaUploader.js - 媒体上传工具
 *
 * 功能：
 * - 图片上传（拖拽+选择，最多4张）
 * - 图片压缩和预览
 * - 视频上传（最多60秒）
 * - Base64编码存储
 * - 文件类型和大小验证
 */

export const mediaUploader = (() => {
  // 配置常量
  const CONFIG = {
    image: {
      maxFiles: 4,
      maxSize: 5 * 1024 * 1024, // 5MB per image
      acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85
    },
    video: {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxDuration: 60, // seconds
      acceptedTypes: ['video/mp4', 'video/webm', 'video/ogg']
    }
  };

  /**
   * 验证图片文件
   */
  const validateImageFile = (file) => {
    const errors = [];

    // 检查文件类型
    if (!CONFIG.image.acceptedTypes.includes(file.type)) {
      errors.push(`不支持的图片格式。仅支持: ${CONFIG.image.acceptedTypes.join(', ')}`);
    }

    // 检查文件大小
    if (file.size > CONFIG.image.maxSize) {
      errors.push(`图片大小不能超过 ${CONFIG.image.maxSize / 1024 / 1024}MB`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  /**
   * 验证视频文件
   */
  const validateVideoFile = (file) => {
    const errors = [];

    // 检查文件类型
    if (!CONFIG.video.acceptedTypes.includes(file.type)) {
      errors.push(`不支持的视频格式。仅支持: ${CONFIG.video.acceptedTypes.join(', ')}`);
    }

    // 检查文件大小
    if (file.size > CONFIG.video.maxSize) {
      errors.push(`视频大小不能超过 ${CONFIG.video.maxSize / 1024 / 1024}MB`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  /**
   * 压缩图片
   * @param {File} file - 原始图片文件
   * @returns {Promise<string>} Base64编码的压缩图片
   */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // 创建canvas进行压缩
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // 计算缩放比例
          let width = img.width;
          let height = img.height;

          if (width > CONFIG.image.maxWidth || height > CONFIG.image.maxHeight) {
            const ratio = Math.min(
              CONFIG.image.maxWidth / width,
              CONFIG.image.maxHeight / height
            );
            width *= ratio;
            height *= ratio;
          }

          // 设置canvas尺寸
          canvas.width = width;
          canvas.height = height;

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为Base64
          const base64 = canvas.toDataURL(file.type, CONFIG.image.quality);
          resolve(base64);
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsDataURL(file);
    });
  };

  /**
   * 上传图片
   * @param {FileList|Array<File>} files - 图片文件列表
   * @returns {Promise<Object>} 上传结果
   */
  const uploadImages = async (files) => {
    const fileArray = Array.from(files);

    // 检查文件数量
    if (fileArray.length > CONFIG.image.maxFiles) {
      return {
        success: false,
        errors: [`最多只能上传 ${CONFIG.image.maxFiles} 张图片`]
      };
    }

    const results = {
      success: true,
      images: [],
      errors: []
    };

    // 处理每个文件
    for (const file of fileArray) {
      // 验证文件
      const validation = validateImageFile(file);
      if (!validation.valid) {
        results.errors.push(...validation.errors);
        continue;
      }

      try {
        // 压缩图片
        const base64 = await compressImage(file);

        results.images.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          width: 0, // Will be set when rendering
          height: 0
        });
      } catch (error) {
        results.errors.push(`${file.name}: ${error.message}`);
      }
    }

    // 如果有任何成功上传的图片，视为成功
    results.success = results.images.length > 0;

    return results;
  };

  /**
   * 读取视频文件并转换为Base64
   * @param {File} file - 视频文件
   * @returns {Promise<string>} Base64编码的视频
   */
  const readVideoFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('视频读取失败'));
      };

      reader.readAsDataURL(file);
    });
  };

  /**
   * 获取视频时长
   * @param {File} file - 视频文件
   * @returns {Promise<number>} 视频时长（秒）
   */
  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error('无法读取视频信息'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  /**
   * 上传视频
   * @param {File} file - 视频文件
   * @returns {Promise<Object>} 上传结果
   */
  const uploadVideo = async (file) => {
    // 验证文件
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      // 检查视频时长
      const duration = await getVideoDuration(file);
      if (duration > CONFIG.video.maxDuration) {
        return {
          success: false,
          errors: [`视频时长不能超过 ${CONFIG.video.maxDuration} 秒`]
        };
      }

      // 读取视频文件
      const base64 = await readVideoFile(file);

      return {
        success: true,
        video: {
          id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          duration,
          data: base64
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  };

  /**
   * 创建拖拽上传区域
   * @param {HTMLElement} element - 目标元素
   * @param {Function} onFilesSelected - 文件选择回调
   */
  const createDropZone = (element, onFilesSelected) => {
    // 防止默认拖拽行为
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 高亮效果
    const highlight = () => {
      element.classList.add('dragover');
    };

    const unhighlight = () => {
      element.classList.remove('dragover');
    };

    // 处理文件拖放
    const handleDrop = (e) => {
      preventDefaults(e);
      unhighlight();

      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        onFilesSelected(files);
      }
    };

    // 绑定事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      element.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      element.addEventListener(eventName, highlight);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      element.addEventListener(eventName, unhighlight);
    });

    element.addEventListener('drop', handleDrop);

    // 返回清理函数
    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        element.removeEventListener(eventName, preventDefaults);
      });
      ['dragenter', 'dragover'].forEach(eventName => {
        element.removeEventListener(eventName, highlight);
      });
      ['dragleave', 'drop'].forEach(eventName => {
        element.removeEventListener(eventName, unhighlight);
      });
      element.removeEventListener('drop', handleDrop);
    };
  };

  /**
   * 创建文件选择器
   * @param {Object} options - 配置选项
   * @returns {Promise<FileList>} 选择的文件
   */
  const selectFiles = (options = {}) => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = options.accept || CONFIG.image.acceptedTypes.join(',');
      input.multiple = options.multiple !== false;

      input.onchange = (e) => {
        resolve(e.target.files);
      };

      input.click();
    });
  };

  /**
   * 生成缩略图
   * @param {string} base64 - Base64编码的图片
   * @param {number} size - 缩略图尺寸
   * @returns {Promise<string>} Base64编码的缩略图
   */
  const generateThumbnail = (base64, size = 150) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算缩放比例（保持宽高比）
        const ratio = Math.min(size / img.width, size / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnail);
      };

      img.onerror = () => {
        reject(new Error('缩略图生成失败'));
      };

      img.src = base64;
    });
  };

  /**
   * 计算存储大小
   * @param {Array<Object>} media - 媒体数据数组
   * @returns {number} 总大小（字节）
   */
  const calculateStorageSize = (media) => {
    return media.reduce((total, item) => {
      // Base64 编码后的大小约为原始大小的 4/3
      const base64Size = item.data ? item.data.length : 0;
      return total + base64Size;
    }, 0);
  };

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 公共API
  return {
    // 配置
    config: CONFIG,

    // 验证
    validateImageFile,
    validateVideoFile,

    // 上传
    uploadImages,
    uploadVideo,
    selectFiles,

    // 图片处理
    compressImage,
    generateThumbnail,

    // 视频处理
    getVideoDuration,

    // UI辅助
    createDropZone,

    // 工具函数
    calculateStorageSize,
    formatFileSize
  };
})();

export default mediaUploader;
