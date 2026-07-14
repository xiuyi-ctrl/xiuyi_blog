用户表需要：id（主键）、username（用户名，唯一）、email（邮箱，唯一）、password（密码，加密存储）、avatar（头像URL）、created_at（创建时间）。
文章表需要：id、title（标题）、content（内容，Markdown 格式）、cover（封面图URL）、category（分类）、tags（标签，JSON数组）、author_id（作者ID，外键关联users）、views（浏览次数）、created_at、updated_at。
分类表需要：id、name（分类名称）、description（分类描述）。

项目表需要：id、title（标题）、description（描述）、skill_using（技术栈，JSON数组）、github_url（github链接）

照片集表需要：id、title（标题）、description（描述）、cover（封面图URL）、created_at、inage_url（`JSON对象，存储照片集下所有图片的URL，键为图片名，值为图片URL地址`)
