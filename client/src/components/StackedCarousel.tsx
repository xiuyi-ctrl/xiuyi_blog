interface Album {
  id: number;
  title: string;
  description: string;
  cover: string;
  image_url: Record<string, string>;
  created_at: string;
}

interface StackedCarouselProps {
  albums: Album[];
  onAlbumClick: (id: number) => void;
}

const rotationFor = (index: number) => Math.sin(index * 1.7) * 4;

export default function StackedCarousel({ albums, onAlbumClick }: StackedCarouselProps) {
  return (
    <div className="stacked-grid-container">
      {albums.map((album, index) => {
        const urls = Object.values(album.image_url || {});
        const photoCount = urls.length;
        const layers = album.cover
          ? [...urls.slice(0, 2), album.cover]
          : urls.slice(0, 3);

        return (
          <div
            key={album.id}
            className="stacked-card"
            style={{ transform: `rotate(${rotationFor(index)}deg)` }}
            onClick={() => onAlbumClick(album.id)}
          >
            <div className="stacked-photo-stack">
              {layers.map((url, i) => (
                <div
                  key={i}
                  className={`stacked-photo-layer ${i === layers.length - 1 ? 'layer-front' : i === layers.length - 2 ? 'layer-mid' : 'layer-back'}`}
                >
                  <img src={url} alt={album.title} loading="lazy" />
                </div>
              ))}
              {photoCount > 0 && (
                <span className="stacked-badge">{photoCount} 张</span>
              )}
            </div>
            <div className="stacked-info">
              <div className="stacked-info-title">{album.title}</div>
              <div className="stacked-info-date">
                {new Date(album.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
