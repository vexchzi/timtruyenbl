/**
 * Tags từ WIKIDICH - Bổ sung vào TagDictionary
 * 
 * Chạy: node seeds/wikidichTags.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const MONGODB_URI = process.env.MONGODB_URI;

const wikidichTags = [
  // ============== THỊ GIÁC TÁC PHẨM (POV) ==============
  {
    keyword: 'thi giac nam chu',
    standardTag: 'Thị Giác Nam Chủ',
    category: 'other',
    priority: 6,
    aliases: ['thị giác nam chủ', 'nam chủ pov', 'góc nhìn nam chủ', 'male lead pov']
  },
  {
    keyword: 'thi giac nu chu',
    standardTag: 'Thị Giác Nữ Chủ',
    category: 'other',
    priority: 6,
    aliases: ['thị giác nữ chủ', 'nữ chủ pov', 'góc nhìn nữ chủ', 'female lead pov']
  },
  {
    keyword: 'ngoi thu nhat',
    standardTag: 'Ngôi Thứ Nhất',
    category: 'other',
    priority: 5,
    aliases: ['ngôi thứ nhất', 'first person', 'ngôi 1', 'pov 1']
  },
  {
    keyword: 'da thi giac',
    standardTag: 'Đa Thị Giác',
    category: 'other',
    priority: 5,
    aliases: ['đa thị giác', 'multiple pov', 'nhiều góc nhìn']
  },
  {
    keyword: 'song thi giac',
    standardTag: 'Song Thị Giác',
    category: 'other',
    priority: 5,
    aliases: ['song thị giác', 'dual pov', 'hai góc nhìn']
  },

  // ============== THẾ GIỚI ==============
  {
    keyword: 'hong hoang',
    standardTag: 'Hồng Hoang',
    category: 'setting',
    priority: 6,
    aliases: ['hồng hoang', 'honghoang', 'primordial', 'thời hồng hoang']
  },
  {
    keyword: 'di the',
    standardTag: 'Dị Thế',
    category: 'setting',
    priority: 6,
    aliases: ['dị thế', 'dithe', 'strange world', 'thế giới khác thường']
  },
  {
    keyword: 'thu nhan',
    standardTag: 'Thú Nhân',
    category: 'setting',
    priority: 7,
    aliases: ['thú nhân', 'thunhan', 'beastman', 'furry', 'người thú', 'nhân thú']
  },
  {
    keyword: 'tinh te',
    standardTag: 'Tinh Tế',
    category: 'setting',
    priority: 6,
    aliases: ['tinh tế', 'tinhte', 'interstellar', 'tinh tế vũ trụ', 'liên tinh', 'vũ trụ']
  },
  {
    keyword: 'nam nam the gioi',
    standardTag: 'Nam Nam Thế Giới',
    category: 'setting',
    priority: 7,
    aliases: ['nam nam thế giới', 'namnamthegioi', 'all male world', 'thế giới toàn nam']
  },
  {
    keyword: 'the gioi song song',
    standardTag: 'Thế Giới Song Song',
    category: 'setting',
    priority: 6,
    aliases: ['thế giới song song', 'parallel world', 'parallel universe', 'vũ trụ song song']
  },
  {
    keyword: 'nguyen thuy',
    standardTag: 'Nguyên Thủy',
    category: 'setting',
    priority: 6,
    aliases: ['nguyên thủy', 'nguyenthuy', 'primitive', 'hoang dã', 'thời nguyên thủy']
  },
  {
    keyword: 'cyberpunk',
    standardTag: 'Cyberpunk',
    category: 'setting',
    priority: 7,
    aliases: ['cyber punk', 'cyber-punk', 'tương lai đen tối']
  },
  {
    keyword: 'steampunk',
    standardTag: 'Steampunk',
    category: 'setting',
    priority: 6,
    aliases: ['steam punk', 'steam-punk', 'hơi nước punk']
  },
  {
    keyword: 'phe tho',
    standardTag: 'Phế Thổ',
    category: 'setting',
    priority: 6,
    aliases: ['phế thổ', 'phetho', 'wasteland', 'đất hoang', 'hậu tận thế']
  },
  {
    keyword: 'cao vo the gioi',
    standardTag: 'Cao Võ',
    category: 'setting',
    priority: 6,
    aliases: ['cao võ', 'cao võ thế giới', 'caovo', 'high martial arts', 'võ thuật cao cấp']
  },

  // ============== HUYỀN HUYỄN ==============
  {
    keyword: 'tay huyen',
    standardTag: 'Tây Huyễn',
    category: 'setting',
    priority: 7,
    aliases: ['tây huyễn', 'tayhuyen', 'western fantasy', 'huyền huyễn phương tây']
  },
  {
    keyword: 'linh khi song lai',
    standardTag: 'Linh Khí Sống Lại',
    category: 'content',
    priority: 6,
    aliases: ['linh khí sống lại', 'linh khí phục hồi', 'spiritual qi revival']
  },
  {
    keyword: 'linh di than quai',
    standardTag: 'Linh Dị Thần Quái',
    category: 'setting',
    priority: 7,
    aliases: ['linh dị thần quái', 'linhdithànquai', 'supernatural', 'thần quái', 'ma quỷ']
  },
  {
    keyword: 'quy tac quai dam',
    standardTag: 'Quy Tắc Quái Đàm',
    category: 'content',
    priority: 6,
    aliases: ['quy tắc quái đàm', 'strange rules', 'quy tắc kỳ quái', 'quái đàm']
  },
  {
    keyword: 'tu chan',
    standardTag: 'Tu Chân',
    category: 'setting',
    priority: 8,
    aliases: ['tu chân', 'tuchan', 'cultivation', 'tu tiên', 'tu luyện']
  },
  {
    keyword: 'ma phap',
    standardTag: 'Ma Pháp',
    category: 'setting',
    priority: 7,
    aliases: ['ma pháp', 'maphap', 'magic', 'phép thuật', 'pháp sư']
  },
  {
    keyword: 'dau khi',
    standardTag: 'Đấu Khí',
    category: 'setting',
    priority: 7,
    aliases: ['đấu khí', 'daukhi', 'battle qi', 'fighting spirit', 'đấu sĩ']
  },
  {
    keyword: 'tien hoa',
    standardTag: 'Tiến Hóa',
    category: 'content',
    priority: 6,
    aliases: ['tiến hóa', 'tienhoa', 'evolution', 'nâng cấp', 'đột biến']
  },
  {
    keyword: 'vu co',
    standardTag: 'Vũ Cổ',
    category: 'setting',
    priority: 6,
    aliases: ['vũ cổ', 'vuco', 'ancient martial', 'cổ đại võ thuật']
  },
  {
    keyword: 'than tien yeu quai',
    standardTag: 'Thần Tiên Yêu Quái',
    category: 'setting',
    priority: 6,
    aliases: ['thần tiên yêu quái', 'thantienyrquai', 'gods and demons', 'thần ma']
  },
  {
    keyword: 'long toc',
    standardTag: 'Long Tộc',
    category: 'setting',
    priority: 6,
    aliases: ['long tộc', 'longtoc', 'dragon clan', 'rồng', 'tộc rồng']
  },
  {
    keyword: 'huyet toc',
    standardTag: 'Huyết Tộc',
    category: 'setting',
    priority: 6,
    aliases: ['huyết tộc', 'huyettoc', 'vampire', 'ma cà rồng', 'tộc hút máu']
  },
  {
    keyword: 'than thoai',
    standardTag: 'Thần Thoại',
    category: 'setting',
    priority: 7,
    aliases: ['thần thoại', 'thanthoai', 'mythology', 'huyền thoại']
  },
  {
    keyword: 'cthulhu',
    standardTag: 'Cthulhu',
    category: 'setting',
    priority: 6,
    aliases: ['cthulhu', 'lovecraft', 'cosmic horror', 'kinh dị vũ trụ']
  },

  // ============== BỐI CẢNH CHI TIẾT ==============
  {
    keyword: 'do thi tinh duyen',
    standardTag: 'Đô Thị Tình Duyên',
    category: 'setting',
    priority: 7,
    aliases: ['đô thị tình duyên', 'dothitinhduyen', 'urban romance', 'tình yêu đô thị']
  },
  {
    keyword: 'tam giao cuu luu',
    standardTag: 'Tam Giáo Cửu Lưu',
    category: 'setting',
    priority: 5,
    aliases: ['tam giáo cửu lưu', 'tamgiaocuuluu', 'various sects']
  },
  {
    keyword: 'hac bang',
    standardTag: 'Hắc Bang',
    category: 'setting',
    priority: 6,
    aliases: ['hắc bang', 'hacbang', 'mafia', 'gangster', 'xã hội đen', 'băng đảng']
  },
  {
    keyword: 'vuon truong',
    standardTag: 'Học Đường',
    category: 'setting',
    priority: 8,
    aliases: ['vườn trường', 'vuontruong', 'school', 'campus', 'trường học', 'học đường']
  },
  {
    keyword: 'hoc vien quy toc',
    standardTag: 'Học Viện Quý Tộc',
    category: 'setting',
    priority: 7,
    aliases: ['học viện quý tộc', 'hocvienquytoc', 'noble academy', 'trường quý tộc']
  },
  {
    keyword: 'chuc truong',
    standardTag: 'Chức Trường',
    category: 'setting',
    priority: 6,
    aliases: ['chức trường', 'chuctruong', 'workplace', 'công sở', 'office']
  },
  {
    keyword: 'giang ho an oan',
    standardTag: 'Giang Hồ',
    category: 'setting',
    priority: 7,
    aliases: ['giang hồ ân oán', 'giang hồ', 'jianghu', 'võ lâm', 'kiếm hiệp']
  },
  {
    keyword: 'truyen co tich',
    standardTag: 'Truyện Cổ Tích',
    category: 'setting',
    priority: 6,
    aliases: ['truyện cổ tích', 'fairytale', 'fairy tale', 'cổ tích']
  },
  {
    keyword: 'thien tai',
    standardTag: 'Thiên Tai',
    category: 'content',
    priority: 6,
    aliases: ['thiên tai', 'thientai', 'natural disaster', 'thảm họa thiên nhiên']
  },
  {
    keyword: 'luu day',
    standardTag: 'Lưu Đày',
    category: 'content',
    priority: 6,
    aliases: ['lưu đày', 'luuday', 'exile', 'bị đày', 'đi đày']
  },
  {
    keyword: 'chay nan',
    standardTag: 'Chạy Nạn',
    category: 'content',
    priority: 6,
    aliases: ['chạy nạn', 'chaynan', 'refuge', 'chạy trốn', 'tị nạn']
  },
  {
    keyword: 'lich su',
    standardTag: 'Lịch Sử',
    category: 'setting',
    priority: 7,
    aliases: ['lịch sử', 'lichsu', 'history', 'historical']
  },
  {
    keyword: 'gia tuong lich su',
    standardTag: 'Giả Tưởng Lịch Sử',
    category: 'setting',
    priority: 6,
    aliases: ['giả tưởng lịch sử', 'alternate history', 'lịch sử giả tưởng', 'if history']
  },
  {
    keyword: 'hai dao',
    standardTag: 'Hải Đảo',
    category: 'setting',
    priority: 5,
    aliases: ['hải đảo', 'haidao', 'island', 'đảo', 'hoang đảo']
  },

  // ============== LĨNH VỰC / NGHỀ NGHIỆP ==============
  {
    keyword: 'khoa cu',
    standardTag: 'Khoa Cử',
    category: 'content',
    priority: 6,
    aliases: ['khoa cử', 'khoacu', 'imperial exam', 'thi cử', 'đỗ đạt']
  },
  {
    keyword: 'my thuc',
    standardTag: 'Mỹ Thực',
    category: 'content',
    priority: 6,
    aliases: ['mỹ thực', 'mythuc', 'gourmet', 'ẩm thực', 'nấu ăn', 'đầu bếp']
  },
  {
    keyword: 'co giap',
    standardTag: 'Cơ Giáp',
    category: 'setting',
    priority: 6,
    aliases: ['cơ giáp', 'cogiap', 'mecha', 'robot', 'gundam']
  },
  {
    keyword: 'do thach',
    standardTag: 'Đổ Thạch',
    category: 'content',
    priority: 5,
    aliases: ['đổ thạch', 'dothach', 'stone gambling', 'cờ bạc đá']
  },
  {
    keyword: 'phong thuy',
    standardTag: 'Phong Thủy',
    category: 'content',
    priority: 6,
    aliases: ['phong thủy', 'phongthuy', 'feng shui', 'bói toán']
  },
  {
    keyword: 'trom mo',
    standardTag: 'Trộm Mộ',
    category: 'content',
    priority: 7,
    aliases: ['trộm mộ', 'trommo', 'tomb raider', 'đào mộ', 'khảo cổ']
  },
  {
    keyword: 'giam bao',
    standardTag: 'Giám Bảo',
    category: 'content',
    priority: 5,
    aliases: ['giám bảo', 'giambao', 'antique appraisal', 'thẩm định cổ vật']
  },
  {
    keyword: 'y thuat',
    standardTag: 'Y Thuật',
    category: 'content',
    priority: 6,
    aliases: ['y thuật', 'ythuat', 'medical', 'bác sĩ', 'đông y', 'tây y', 'thần y']
  },
  {
    keyword: 'vong phoi',
    standardTag: 'Võng Phối',
    category: 'content',
    priority: 6,
    aliases: ['võng phối', 'vongphoi', 'online dating', 'internet couple', 'quen qua mạng']
  },
  {
    keyword: 'phat song truc tiep',
    standardTag: 'Phát Sóng Trực Tiếp',
    category: 'content',
    priority: 6,
    aliases: ['phát sóng trực tiếp', 'livestream', 'live stream', 'streamer', 'trực tiếp']
  },
  {
    keyword: 'vong hong',
    standardTag: 'Võng Hồng',
    category: 'content',
    priority: 6,
    aliases: ['võng hồng', 'vonghong', 'internet celebrity', 'influencer', 'KOL']
  },
  {
    keyword: 'viet van',
    standardTag: 'Viết Văn',
    category: 'content',
    priority: 5,
    aliases: ['viết văn', 'vietvan', 'writing', 'tác giả', 'nhà văn', 'sáng tác']
  },
  {
    keyword: 'che tac',
    standardTag: 'Chế Tác',
    category: 'content',
    priority: 5,
    aliases: ['chế tác', 'chetac', 'crafting', 'rèn', 'đúc', 'làm đồ']
  },
  {
    keyword: 'lu hanh',
    standardTag: 'Lữ Hành',
    category: 'content',
    priority: 5,
    aliases: ['lữ hành', 'luhanh', 'travel', 'du lịch', 'phiêu lưu']
  },
  {
    keyword: 'mao hiem',
    standardTag: 'Mạo Hiểm',
    category: 'content',
    priority: 6,
    aliases: ['mạo hiểm', 'maohiem', 'adventure', 'phiêu lưu', 'thám hiểm']
  },
  {
    keyword: 'duong oa',
    standardTag: 'Dưỡng Oa',
    category: 'content',
    priority: 5,
    aliases: ['dưỡng oa', 'duongoa', 'raising child', 'nuôi con', 'làm cha mẹ']
  },
  {
    keyword: 'tong nghe',
    standardTag: 'Tổng Nghệ',
    category: 'setting',
    priority: 6,
    aliases: ['tổng nghệ', 'tongnghe', 'variety show', 'chương trình giải trí']
  },
  {
    keyword: 'luyen tong',
    standardTag: 'Luyện Tông',
    category: 'content',
    priority: 5,
    aliases: ['luyện tông', 'luyentong', 'sect building', 'xây dựng môn phái']
  },
  {
    keyword: 'gioi thoi trang',
    standardTag: 'Giới Thời Trang',
    category: 'setting',
    priority: 6,
    aliases: ['giới thời trang', 'gioithoitrang', 'fashion', 'thời trang', 'người mẫu']
  },
  {
    keyword: 'giai mat',
    standardTag: 'Giải Mật',
    category: 'content',
    priority: 6,
    aliases: ['giải mật', 'giaimat', 'decryption', 'giải mã', 'bí ẩn']
  },
  {
    keyword: 'nghien cuu khoa hoc',
    standardTag: 'Nghiên Cứu Khoa Học',
    category: 'content',
    priority: 5,
    aliases: ['nghiên cứu khoa học', 'science research', 'khoa học', 'nhà khoa học']
  },
  {
    keyword: 'the thao',
    standardTag: 'Thể Thao',
    category: 'setting',
    priority: 7,
    aliases: ['thể thao', 'thethao', 'sports', 'vận động viên', 'thi đấu thể thao']
  },
  {
    keyword: 'thi dau canh ky',
    standardTag: 'E-Sport',
    category: 'setting',
    priority: 8,
    aliases: ['thi đấu cạnh kỹ', 'thiducanhky', 'esports', 'game cạnh tranh', 'pro player']
  },
  {
    keyword: 'co vo',
    standardTag: 'Cổ Võ',
    category: 'setting',
    priority: 6,
    aliases: ['cổ võ', 'covo', 'ancient martial arts', 'võ thuật cổ đại']
  },
  {
    keyword: 'dua xe',
    standardTag: 'Đua Xe',
    category: 'content',
    priority: 6,
    aliases: ['đua xe', 'duaxe', 'racing', 'tay đua', 'công thức 1', 'f1']
  },

  // ============== THỜI KHÔNG / XUYÊN ==============
  {
    keyword: 'thai xuyen',
    standardTag: 'Thai Xuyên',
    category: 'content',
    priority: 7,
    aliases: ['thai xuyên', 'thaixuyen', 'fetal transmigration', 'xuyên từ bào thai']
  },
  {
    keyword: 'than xuyen',
    standardTag: 'Thân Xuyên',
    category: 'content',
    priority: 7,
    aliases: ['thân xuyên', 'thanxuyen', 'body transmigration', 'xuyên vào thân thể']
  },
  {
    keyword: 'xuyen cham',
    standardTag: 'Xuyên Chậm',
    category: 'content',
    priority: 6,
    aliases: ['xuyên chậm', 'xuyencham', 'slow transmigration', 'xuyên từ từ']
  },
  {
    keyword: 'co xuyen kim',
    standardTag: 'Cổ Xuyên Kim',
    category: 'content',
    priority: 7,
    aliases: ['cổ xuyên kim', 'coxuyenkim', 'ancient to modern', 'cổ đại xuyên hiện đại']
  },
  {
    keyword: 'dan xuyen',
    standardTag: 'Đan Xuyên',
    category: 'content',
    priority: 6,
    aliases: ['đan xuyên', 'danxuyen', 'interleaved transmigration']
  },
  {
    keyword: 'song xuyen',
    standardTag: 'Song Xuyên',
    category: 'content',
    priority: 7,
    aliases: ['song xuyên', 'songxuyen', 'double transmigration', 'cả hai đều xuyên']
  },
  {
    keyword: 'song trong sinh',
    standardTag: 'Song Trọng Sinh',
    category: 'content',
    priority: 7,
    aliases: ['song trọng sinh', 'songtrongsinh', 'double rebirth', 'cả hai đều trọng sinh']
  },
  {
    keyword: 'chet di song lai',
    standardTag: 'Chết Đi Sống Lại',
    category: 'content',
    priority: 6,
    aliases: ['chết đi sống lại', 'resurrection', 'hồi sinh', 'sống lại']
  },
  {
    keyword: 'qua lai thoi khong',
    standardTag: 'Qua Lại Thời Không',
    category: 'content',
    priority: 6,
    aliases: ['qua lại thời không', 'time loop', 'lặp thời gian', 'du hành thời gian']
  },
  {
    keyword: 'vi dien',
    standardTag: 'Vị Diện',
    category: 'content',
    priority: 5,
    aliases: ['vị diện', 'vidien', 'parallel dimension', 'chiều không gian']
  },
  {
    keyword: 'thoi xuan thu',
    standardTag: 'Thời Xuân Thu',
    category: 'setting',
    priority: 5,
    aliases: ['thời xuân thu', 'spring autumn period', 'xuân thu']
  },
  {
    keyword: 'thoi chien quoc',
    standardTag: 'Thời Chiến Quốc',
    category: 'setting',
    priority: 5,
    aliases: ['thời chiến quốc', 'warring states', 'chiến quốc']
  },
  {
    keyword: 'dai tan',
    standardTag: 'Đại Tần',
    category: 'setting',
    priority: 5,
    aliases: ['đại tần', 'daitan', 'qin dynasty', 'nhà tần']
  },
  {
    keyword: 'dai han',
    standardTag: 'Đại Hán',
    category: 'setting',
    priority: 5,
    aliases: ['đại hán', 'daihan', 'han dynasty', 'nhà hán']
  },
  {
    keyword: 'dai duong',
    standardTag: 'Đại Đường',
    category: 'setting',
    priority: 5,
    aliases: ['đại đường', 'daiduong', 'tang dynasty', 'nhà đường']
  },
  {
    keyword: 'dai tong',
    standardTag: 'Đại Tống',
    category: 'setting',
    priority: 5,
    aliases: ['đại tống', 'daitong', 'song dynasty', 'nhà tống']
  },
  {
    keyword: 'dai minh',
    standardTag: 'Đại Minh',
    category: 'setting',
    priority: 5,
    aliases: ['đại minh', 'daiminh', 'ming dynasty', 'nhà minh']
  },
  {
    keyword: 'dai thanh',
    standardTag: 'Đại Thanh',
    category: 'setting',
    priority: 5,
    aliases: ['đại thanh', 'daithanh', 'qing dynasty', 'nhà thanh']
  },
  {
    keyword: 'thoi trung co',
    standardTag: 'Thời Trung Cổ',
    category: 'setting',
    priority: 6,
    aliases: ['thời trung cổ', 'medieval', 'trung cổ', 'middle ages']
  },

  // ============== BÀN TAY VÀNG / HỆ THỐNG ==============
  {
    keyword: 'vo he thong',
    standardTag: 'Vô Hệ Thống',
    category: 'content',
    priority: 6,
    aliases: ['vô hệ thống', 'vohethong', 'no system', 'không có hệ thống']
  },
  {
    keyword: 'vo ban tay vang',
    standardTag: 'Vô Bàn Tay Vàng',
    category: 'content',
    priority: 6,
    aliases: ['vô bàn tay vàng', 'no golden finger', 'không có cheat']
  },
  {
    keyword: 'nop ban tay vang',
    standardTag: 'Nộp Bàn Tay Vàng',
    category: 'content',
    priority: 5,
    aliases: ['nộp bàn tay vàng', 'give up cheat', 'từ bỏ cheat']
  },
  {
    keyword: 'tuy than gia gia',
    standardTag: 'Tùy Thân Gia Gia',
    category: 'content',
    priority: 5,
    aliases: ['tùy thân gia gia', 'portable grandpa', 'ông nội trong người']
  },
  {
    keyword: 'song he thong',
    standardTag: 'Song Hệ Thống',
    category: 'content',
    priority: 6,
    aliases: ['song hệ thống', 'dual system', 'hai hệ thống']
  },
  {
    keyword: 'nhieu he thong',
    standardTag: 'Nhiều Hệ Thống',
    category: 'content',
    priority: 6,
    aliases: ['nhiều hệ thống', 'multiple systems', 'đa hệ thống']
  },
  {
    keyword: 'rut tham trung thuong',
    standardTag: 'Rút Thăm Trúng Thưởng',
    category: 'content',
    priority: 6,
    aliases: ['rút thăm trúng thưởng', 'gacha', 'lottery', 'quay thưởng']
  },
  {
    keyword: 'tuy than khong gian',
    standardTag: 'Tùy Thân Không Gian',
    category: 'content',
    priority: 7,
    aliases: ['tùy thân không gian', 'portable space', 'không gian riêng', 'túi trữ vật']
  },
  {
    keyword: 'linh tuyen',
    standardTag: 'Linh Tuyền',
    category: 'content',
    priority: 5,
    aliases: ['linh tuyền', 'spirit spring', 'suối linh khí']
  },
  {
    keyword: 'tool mo phong',
    standardTag: 'Tool Mô Phỏng',
    category: 'content',
    priority: 5,
    aliases: ['tool mô phỏng', 'simulation', 'giả lập']
  },
  {
    keyword: 'hop thanh',
    standardTag: 'Hợp Thành',
    category: 'content',
    priority: 5,
    aliases: ['hợp thành', 'synthesis', 'kết hợp', 'chế tạo']
  },
  {
    keyword: 'app',
    standardTag: 'App',
    category: 'content',
    priority: 5,
    aliases: ['application', 'ứng dụng', 'phần mềm']
  },
  {
    keyword: 'group chat',
    standardTag: 'Group Chat',
    category: 'content',
    priority: 5,
    aliases: ['nhóm chat', 'chat group', 'hội thoại nhóm']
  },
  {
    keyword: 'thau thi',
    standardTag: 'Thấu Thị',
    category: 'content',
    priority: 6,
    aliases: ['thấu thị', 'thauthi', 'x-ray vision', 'nhìn xuyên']
  },
  {
    keyword: 'thoi mien',
    standardTag: 'Thôi Miên',
    category: 'content',
    priority: 6,
    aliases: ['thôi miên', 'thoimien', 'hypnosis', 'mê hoặc']
  },
  {
    keyword: 'doc tam',
    standardTag: 'Đọc Tâm',
    category: 'content',
    priority: 6,
    aliases: ['đọc tâm', 'doctam', 'mind reading', 'đọc suy nghĩ', 'ngoại cảm']
  },
  {
    keyword: 'ngon linh',
    standardTag: 'Ngôn Linh',
    category: 'content',
    priority: 5,
    aliases: ['ngôn linh', 'ngonlinh', 'word spirit', 'lời nói có sức mạnh']
  },
  {
    keyword: 'kich thau',
    standardTag: 'Kịch Thấu',
    category: 'content',
    priority: 5,
    aliases: ['kịch thấu', 'kichthau', 'script knowledge', 'biết trước kịch bản']
  },
  {
    keyword: 'tien tri',
    standardTag: 'Tiên Tri',
    category: 'content',
    priority: 6,
    aliases: ['tiên tri', 'tientri', 'prophecy', 'dự đoán tương lai', 'nhìn thấy tương lai']
  },
  {
    keyword: 'nghe hieu dong vat',
    standardTag: 'Nghe Hiểu Động Vật',
    category: 'content',
    priority: 5,
    aliases: ['nghe hiểu động vật', 'animal communication', 'nói chuyện với động vật']
  },
  {
    keyword: 'nghe hieu thuc vat',
    standardTag: 'Nghe Hiểu Thực Vật',
    category: 'content',
    priority: 5,
    aliases: ['nghe hiểu thực vật', 'plant communication', 'nói chuyện với cây']
  },
];

// ============== MAIN ==============
async function seedWikidichTags() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('📝 Adding WIKIDICH tags to dictionary...');
    
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const tag of wikidichTags) {
      try {
        const existing = await TagDictionary.findOne({ keyword: tag.keyword });
        
        if (existing) {
          // Merge aliases
          const newAliases = [...new Set([...existing.aliases, ...tag.aliases])];
          await TagDictionary.updateOne(
            { keyword: tag.keyword },
            { $set: { aliases: newAliases } }
          );
          updated++;
        } else {
          await TagDictionary.create(tag);
          added++;
        }
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
        } else {
          console.error(`Error with tag ${tag.keyword}:`, err.message);
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`   Added: ${added}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);

    const total = await TagDictionary.countDocuments();
    console.log(`\n📊 Total tags in dictionary: ${total}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

seedWikidichTags();
