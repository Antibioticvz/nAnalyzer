export const TARGET_SAMPLE_RATE = 16000;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',').pop() || '';
        resolve(base64);
      } else {
        reject(new Error('Failed to encode audio blob.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to process audio blob.'));
    reader.readAsDataURL(blob);
  });

const writeString = (view: DataView, offset: number, data: string) => {
  for (let i = 0; i < data.length; i += 1) {
    view.setUint8(offset + i, data.charCodeAt(i));
  }
};

const encodeWavBuffer = (audioBuffer: AudioBuffer) => {
  const { numberOfChannels, sampleRate, length } = audioBuffer;
  const bytesPerSample = 2;
  const dataSize = length * numberOfChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
  view.setUint16(32, numberOfChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      let sample = channelData[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return buffer;
};

export interface NormalizedAudio {
  base64: string;
  duration: number;
}

export const convertRecordingToBase64 = async (
  blob: Blob,
  fallbackDuration?: number
): Promise<NormalizedAudio> => {
  if (typeof window === 'undefined') {
    return { base64: await blobToBase64(blob), duration: fallbackDuration || 0 };
  }

  const globalWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  };

  const AudioContextClass =
    globalWindow.AudioContext || globalWindow.webkitAudioContext;
  const OfflineAudioContextClass =
    globalWindow.OfflineAudioContext || globalWindow.webkitOfflineAudioContext;

  if (!AudioContextClass || !OfflineAudioContextClass) {
    return {
      base64: await blobToBase64(blob),
      duration: fallbackDuration ?? 0,
    };
  }

  const audioContext = new AudioContextClass();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const offlineContext = new OfflineAudioContextClass(
      decodedBuffer.numberOfChannels,
      Math.ceil(decodedBuffer.duration * TARGET_SAMPLE_RATE),
      TARGET_SAMPLE_RATE
    );

    const source = offlineContext.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    const wavBuffer = encodeWavBuffer(renderedBuffer);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    const base64 = await blobToBase64(wavBlob);
    await audioContext.close();

    return {
      base64,
      duration: renderedBuffer.duration,
    };
  } catch (conversionError) {
    try {
      await audioContext.close();
    } catch (closeError) {
      // Ignore close errors
    }

    return {
      base64: await blobToBase64(blob),
      duration: fallbackDuration ?? 0,
    };
  }
};
