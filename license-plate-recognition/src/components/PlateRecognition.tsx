import { useState } from 'react';
import { Upload, Button, Card, List, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

interface PlateResult {
  code: string;
  conf: number;
  plate_type: string;
  box: number[];
}

interface PlateRecognitionProps {
  onRecognized: (result: { code: string; image: string }) => void;
}

const PlateRecognition: React.FC<PlateRecognitionProps> = ({ onRecognized }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlateResult[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/v1/rec', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.code === 5000) {
        setResults(response.data.result.plate_list);
        const imageUrl = URL.createObjectURL(file);
        setPreviewImage(imageUrl);
        
        if (response.data.result.plate_list.length > 0) {
          onRecognized({
            code: response.data.result.plate_list[0].code,
            image: imageUrl
          });
        }
      }
    } catch (error) {
      console.error('识别失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleUpload(file);
      return false;
    },
    maxCount: 1,
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title="车牌识别系统" style={{ marginBottom: '20px' }}>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>选择图片</Button>
        </Upload>
      </Card>

      <Spin spinning={loading}>
        {previewImage && (
          <Card title="预览图片" style={{ marginBottom: '20px' }}>
            <img
              src={previewImage}
              alt="预览"
              style={{ maxWidth: '100%', maxHeight: '300px' }}
            />
          </Card>
        )}

        {results.length > 0 && (
          <Card title="识别结果">
            <List
              dataSource={results}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={`车牌号: ${item.code}`}
                    description={
                      <>
                        <p>车牌类型: {item.plate_type}</p>
                        <p>置信度: {(item.conf * 100).toFixed(2)}%</p>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default PlateRecognition;