export default function Music() {
  return (
    <div className="container">
      <h1 className="page-title">音乐</h1>
      <p className="page-subtitle">Listen to Music</p>
      <div className="music-page-player">
        <div
          dangerouslySetInnerHTML={{
            __html: '<meting-js server="netease" type="playlist" id="13521757209" mutex="true" preload="auto" theme="#D4A76A" loop="all"></meting-js>'
          }}
        />
      </div>
    </div>
  );
}
