/**
 * Seed Data cho TagDictionary - Đam Mỹ Tags
 * 
 * Chạy: node seeds/tagDictionarySeeds.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_recommender';

const seedData = [
  // ============== THỂ LOẠI (TYPE) ==============
  {
    keyword: 'dam my',
    standardTag: 'Đam Mỹ',
    category: 'type',
    priority: 10,
    aliases: ['đam mỹ', 'dammy', 'bl', 'boys love', 'yaoi', 'danmei', 'đan mỹ', 'nam nam', 'gay', 
              'boylove', 'boy x boy', 'boyxboy', "boy's love", 'boys love', "boys' love",
              'đam-mỹ', 'dam-my', 'dammei', 'dam mei', 'đam', 'dam', 'dammie',
              'sinhalabl', 'sinhala bl', 'blmalayalam', 'blpinoy', 'blchina', 'blfictions', 
              'desibl', 'indianbl', 'mizobl', 'boy×boy', 'bxb', 'mxm', 'malexmale',
              'đm', 'dm', 'boysxboys', 'boytoboy', 'mentomen', 'mlm', 'mascxmasc']
  },
  {
    keyword: 'bach hop',
    standardTag: 'Bách Hợp',
    category: 'type',
    priority: 9,
    aliases: ['bách hợp', 'bachhop', 'gl', 'girls love', 'yuri', 'lesbian', 'nữ nữ', 'girlxgirl']
  },
  {
    keyword: 'ngon tinh',
    standardTag: 'Ngôn Tình',
    category: 'type',
    priority: 8,
    aliases: ['ngôn tình', 'ngontinh', 'het', 'heterosexual', 'nam nữ', 'bg', 'boy girl']
  },
  {
    keyword: 'fanfic',
    standardTag: 'Fanfic',
    category: 'type',
    priority: 8,
    aliases: [
      'đồng nhân', 'dong nhan', 'dongnhan', 'đồngnhân', 'đồng-nhân', 'dong-nhan',
      'fanfic', 'fanfiction', 'fan fiction', 'fanfics', 'fic', 'fics',
      'fiction', 'shortfic', 'drabble', 'ficlet',
      'crossover', 'cross over', 'au', 'alternate universe',
      'rps', 'rpf', 'real person', 'real person fiction',
      'chuyển ver', 'chuyen ver', 'convert', 'chuyển', 'ver',
      'bsd', 'mdzs', 'cql', 'tgcf', 'svsss', 'mha', 'bnha', 'hxh', 'aot', 'snk',
      'hp', 'harrypotter', 'drarry', 'naruto', 'bleach', 'kny', 'jjk', 'haikyuu',
      'bts', 'exo', 'nct', 'skz', 'txt', 'enhypen', 'seventeen', 'svt',
      'gmmtv', 'brightwin', 'mewgulf', 'taynew', 'offgun', 'earthmix', 'bkpp',
      'lck', 'lpl', 't1', 'geng', 'faker', 'countryhumans',
      'yizhan', 'zhanyi', 'wangxian', 'taekook', 'vkook', 'kookv', 'jikook', 'kookmin',
      'drarry', 'sasunaru', 'kagehina', 'kaishin', 'solby', 'forthbeam'
    ]
  },
  {
    keyword: 'bl han',
    standardTag: 'BL Hàn',
    category: 'type',
    priority: 7,
    aliases: ['bl hàn', 'blhan', 'korean bl', 'manhwa bl', 'bl korea', 'hàn quốc bl']
  },
  {
    keyword: 'truyen phuong tay',
    standardTag: 'Truyện Phương Tây',
    category: 'type',
    priority: 7,
    aliases: ['truyện phương tây', 'western novel', 'truyện âu mỹ', 'novel phương tây', 'eu novel']
  },
  {
    keyword: 'nguyen sang',
    standardTag: 'Nguyên Sang',
    category: 'type',
    priority: 6,
    aliases: ['nguyên sang', 'nguyensang', 'original', 'sáng tác gốc', 'original work']
  },
  {
    keyword: 'doan van',
    standardTag: 'Đoản Văn',
    category: 'type',
    priority: 6,
    aliases: ['đoản văn', 'doanvan', 'short story', 'oneshot', 'one shot', 'truyện ngắn', 'ngắn',
              'đoản', 'doan', 'đoản-văn', 'doan-van', 'doản']
  },

  // ============== KẾT CỤC (ENDING) ==============
  {
    keyword: 'he',
    standardTag: 'Happy Ending',
    category: 'ending',
    priority: 10,
    aliases: ['happy ending', 'ket thuc vui', 'kết thúc có hậu', 'hạnh phúc', 'hậu', 'kết đẹp']
  },
  {
    keyword: 'be',
    standardTag: 'Bad Ending',
    category: 'ending',
    priority: 10,
    aliases: ['bad ending', 'kết thúc buồn', 'bi kịch', 'bi thương', 'sad ending', 'kết buồn']
  },
  {
    keyword: 'oe',
    standardTag: 'Open Ending',
    category: 'ending',
    priority: 8,
    aliases: ['open ending', 'kết thúc mở', 'kết mở']
  },

  // ============== THỜI ĐẠI (ERA) ==============
  {
    keyword: 'hien dai',
    standardTag: 'Hiện Đại',
    category: 'era',
    priority: 9,
    aliases: ['hiện đại', 'hiendai', 'modern', 'đương đại']
  },
  {
    keyword: 'co dai',
    standardTag: 'Cổ Đại',
    category: 'era',
    priority: 9,
    aliases: ['cổ đại', 'codai', 'ancient', 'cổ trang', 'phong kiến', 'co trang']
  },
  {
    keyword: 'can dai',
    standardTag: 'Cận Đại',
    category: 'era',
    priority: 8,
    aliases: ['cận đại', 'candai', 'early modern', 'cận hiện đại']
  },
  {
    keyword: 'dan quoc',
    standardTag: 'Dân Quốc',
    category: 'era',
    priority: 7,
    aliases: ['dân quốc', 'danquoc', 'republic era', 'thời dân quốc']
  },
  {
    keyword: 'tuong lai',
    standardTag: 'Tương Lai',
    category: 'era',
    priority: 7,
    aliases: ['tương lai', 'tuonglai', 'future', 'khoa học viễn tưởng', 'sci-fi']
  },
  {
    keyword: 'nien dai',
    standardTag: 'Niên Đại',
    category: 'era',
    priority: 6,
    aliases: ['niên đại', 'niendai', 'niên đại 80', 'niên đại 70', 'thập niên', 'niên đại văn']
  },

  // ============== THẾ GIỚI (WORLD) ==============
  {
    keyword: 'mat the',
    standardTag: 'Mạt Thế',
    category: 'world',
    priority: 8,
    aliases: ['mạt thế', 'matthe', 'apocalypse', 'tận thế', 'end of world', 'zombie']
  },
  {
    keyword: 'di gioi',
    standardTag: 'Dị Giới',
    category: 'world',
    priority: 8,
    aliases: ['dị giới', 'digioi', 'another world', 'isekai', 'thế giới khác', 'dị thế']
  },
  {
    keyword: 'abo',
    standardTag: 'ABO',
    category: 'world',
    priority: 9,
    aliases: ['omegaverse', 'alpha beta omega', 'a/b/o']
  },
  {
    keyword: 'eabo',
    standardTag: 'EABO',
    category: 'world',
    priority: 8,
    aliases: ['eabo', 'e-abo', 'eastern abo', 'abo biến thể']
  },
  {
    keyword: 'tu tien',
    standardTag: 'Tu Tiên',
    category: 'world',
    priority: 8,
    aliases: ['tu tiên', 'tutien', 'cultivation', 'tu chân', 'tiên hiệp', 'tu luyện']
  },
  {
    keyword: 'ky huyen',
    standardTag: 'Kỳ Huyễn',
    category: 'world',
    priority: 7,
    aliases: ['kỳ huyễn', 'kyhuyen', 'fantasy', 'huyền huyễn', 'huyền ảo', 'ma pháp', 'tây huyễn']
  },
  {
    keyword: 'vong du',
    standardTag: 'Võng Du',
    category: 'world',
    priority: 7,
    aliases: ['võng du', 'vongdu', 'mmorpg', 'game online', 'virtual reality', 'vr game']
  },
  {
    keyword: 'phuong tay',
    standardTag: 'Phương Tây',
    category: 'world',
    priority: 6,
    aliases: ['phương tây', 'phuongtay', 'western', 'âu mỹ', 'châu âu']
  },
  {
    keyword: 'tinh te',
    standardTag: 'Tinh Tế',
    category: 'world',
    priority: 6,
    aliases: ['tinh tế', 'tinhte', 'interstellar', 'vũ trụ', 'không gian']
  },

  // ============== BỐI CẢNH (SETTING) ==============
  {
    keyword: 'cung dinh',
    standardTag: 'Cung Đình',
    category: 'setting',
    priority: 8,
    aliases: ['cung đình', 'cungdinh', 'palace', 'hoàng cung', 'hậu cung', 'triều đình', 'hầu tước', 'cung đình hầu tước']
  },
  {
    keyword: 'hoc duong',
    standardTag: 'Học Đường',
    category: 'setting',
    priority: 8,
    aliases: ['học đường', 'hocduong', 'school', 'campus', 'trường học', 'sinh viên', 'đại học', 'vườn trường']
  },
  {
    keyword: 'quan nhan',
    standardTag: 'Quân Nhân',
    category: 'setting',
    priority: 8,
    aliases: ['quân nhân', 'quannhan', 'military', 'quân đội', 'lính', 'bộ đội', 'quân giáo']
  },
  {
    keyword: 'gioi giai tri',
    standardTag: 'Giới Giải Trí',
    category: 'setting',
    priority: 8,
    aliases: ['giới giải trí', 'gioigiaitri', 'showbiz', 'entertainment', 'idol', 'ca sĩ', 'diễn viên', 'ngôi sao', 'phim ảnh']
  },
  {
    keyword: 'hao mon',
    standardTag: 'Hào Môn',
    category: 'setting',
    priority: 8,
    aliases: ['hào môn', 'haomon', 'rich family', 'hào môn thế gia', 'danh gia vọng tộc', 'đại gia', 'nhà giàu']
  },
  {
    keyword: 'giang ho',
    standardTag: 'Giang Hồ',
    category: 'setting',
    priority: 7,
    aliases: ['giang hồ', 'giangho', 'jianghu', 'võ lâm', 'kiếm hiệp', 'giang hồ ân oán']
  },
  {
    keyword: 'do thi',
    standardTag: 'Đô Thị',
    category: 'setting',
    priority: 7,
    aliases: ['đô thị', 'dothi', 'urban', 'thành phố', 'đô thị tình duyên']
  },
  {
    keyword: 'nong thon',
    standardTag: 'Nông Thôn',
    category: 'setting',
    priority: 6,
    aliases: ['nông thôn', 'nongthon', 'rural', 'làng quê', 'điền viên', 'làm ruộng']
  },
  {
    keyword: 'quan truong',
    standardTag: 'Quan Trường',
    category: 'setting',
    priority: 7,
    aliases: ['quan trường', 'quantruong', 'politics', 'chính trị', 'quan chức', 'chức trường']
  },
  {
    keyword: 'esport',
    standardTag: 'E-Sport',
    category: 'setting',
    priority: 8,
    aliases: ['esport', 'game', 'gaming', 'pro player', 'thi đấu game', 'điện tử cạnh tranh', 'trò chơi']
  },
  {
    keyword: 'kinh doanh',
    standardTag: 'Kinh Doanh',
    category: 'setting',
    priority: 7,
    aliases: ['kinh doanh', 'kinhdoanh', 'business', 'kinh thương', 'thương trường']
  },

  // ============== PHONG CÁCH (GENRE) ==============
  {
    keyword: 'nguoc',
    standardTag: 'Ngược',
    category: 'genre',
    priority: 10,
    aliases: ['ngược', 'nguoc', 'nguoc tam', 'ngược tâm', 'angst', 'abuse', 'ngược thân', 'đau thương', 'ngược văn']
  },
  {
    keyword: 'sung',
    standardTag: 'Sủng',
    category: 'genre',
    priority: 10,
    aliases: ['sủng', 'sung', 'doting', 'sủng văn', 'cưng chiều', 'sủng nịnh', 'yêu chiều', 'pamper', 
              'ngọt sủng', 'ngotsủng', 'ngotsung', 'sủng ngọt', 'sungngot', 'công sủng thụ', 'congsungthu']
  },
  {
    keyword: 'ngot',
    standardTag: 'Ngọt',
    category: 'genre',
    priority: 9,
    aliases: ['ngọt', 'ngot', 'sweet', 'fluffy', 'ngọt văn', 'ngọt sến', 'đường', 'sắc đường']
  },
  {
    keyword: 'hai',
    standardTag: 'Hài',
    category: 'genre',
    priority: 8,
    aliases: ['hài', 'hai', 'comedy', 'hài hước', 'funny', 'humor', 'vui vẻ', 
              'khôi hài', 'khoihai', 'hài kịch', 'nhẹ nhàng vui vẻ', 'humour']
  },
  {
    keyword: 'diem van',
    standardTag: 'Điềm Văn',
    category: 'genre',
    priority: 7,
    aliases: ['điềm văn', 'diemvan', 'slice of life', 'nhẹ nhàng', 'bình lặng', 'thanh đạm']
  },
  {
    keyword: 'chinh kich',
    standardTag: 'Chính Kịch',
    category: 'genre',
    priority: 7,
    aliases: ['chính kịch', 'chinhkich', 'drama', 'kịch tính']
  },
  {
    keyword: 'trinh tham',
    standardTag: 'Trinh Thám',
    category: 'genre',
    priority: 7,
    aliases: ['trinh thám', 'trinhtham', 'detective', 'mystery', 'phá án', 'điều tra', 'suy luận', 'suyluan']
  },
  {
    keyword: 'hac am',
    standardTag: 'Hắc Ám',
    category: 'genre',
    priority: 6,
    aliases: ['hắc ám', 'hacam', 'dark', 'tối tăm', 'u ám', 'dark romance']
  },
  {
    keyword: 'cau huyet',
    standardTag: 'Cẩu Huyết',
    category: 'genre',
    priority: 7,
    aliases: ['cẩu huyết', 'cauhuyet', 'dogblood', 'máu chó']
  },
  {
    keyword: 'am ap',
    standardTag: 'Ấm Áp',
    category: 'genre',
    priority: 7,
    aliases: ['ấm áp', 'amap', 'warm', 'wholesome', 'chữa lành']
  },
  {
    keyword: 'sang van',
    standardTag: 'Sảng Văn',
    category: 'genre',
    priority: 7,
    aliases: ['sảng văn', 'sangvan', 'satisfying', 'bàn tay vàng', 'sướng']
  },
  {
    keyword: 'kinh di',
    standardTag: 'Kinh Dị',
    category: 'genre',
    priority: 7,
    aliases: ['kinh dị', 'kinhdi', 'horror', 'sợ hãi', 'rùng rợn']
  },
  {
    keyword: 'ho sung',
    standardTag: 'Hỗ Sủng',
    category: 'genre',
    priority: 8,
    aliases: ['hỗ sủng', 'hosung', 'mutual pampering', 'sủng lẫn nhau']
  },
  {
    keyword: 'nguoc luyen tinh tham',
    standardTag: 'Ngược Luyến Tình Thâm',
    category: 'genre',
    priority: 7,
    aliases: ['ngược luyến tình thâm', 'nguocluyentinhtham', 'bitter love', 'tình yêu cay đắng']
  },
  {
    keyword: 'nhiet huyet',
    standardTag: 'Nhiệt Huyết',
    category: 'genre',
    priority: 6,
    aliases: ['nhiệt huyết', 'nhiethuyet', 'passionate', 'hot blooded']
  },

  // ============== XU HƯỚNG (PLOT) ==============
  {
    keyword: 'xuyen viet',
    standardTag: 'Xuyên Việt',
    category: 'plot',
    priority: 9,
    aliases: ['xuyên việt', 'xuyenviet', 'transmigration', 'xuyên qua']
  },
  {
    keyword: 'xuyen khong',
    standardTag: 'Xuyên Không',
    category: 'plot',
    priority: 9,
    aliases: ['xuyên không', 'xuyenkhong', 'time travel', 'xuyên thời gian']
  },
  {
    keyword: 'xuyen sach',
    standardTag: 'Xuyên Sách',
    category: 'plot',
    priority: 8,
    aliases: ['xuyên sách', 'xuyensach', 'transmigrate into book', 'xuyên văn', 'xuyên truyện', 'xuyên thư']
  },
  {
    keyword: 'trung sinh',
    standardTag: 'Trùng Sinh',
    category: 'plot',
    priority: 9,
    aliases: ['trùng sinh', 'trungsinh', 'trọng sinh', 'trongsinh', 'reborn', 'rebirth', 'sống lại', 'hồi sinh', 'tái sinh', 'đầu thai lại']
  },
  {
    keyword: 'xuyen nhanh',
    standardTag: 'Xuyên Nhanh',
    category: 'plot',
    priority: 8,
    aliases: ['xuyên nhanh', 'xuyennhanh', 'quick transmigration', 'fast wear', 'xuyên nhanh nhiều thế giới']
  },
  {
    keyword: 'he thong',
    standardTag: 'Hệ Thống',
    category: 'plot',
    priority: 8,
    aliases: ['hệ thống', 'hethong', 'system', 'kim thủ chỉ', 'bàn tay vàng']
  },
  {
    keyword: 'vo han luu',
    standardTag: 'Vô Hạn Lưu',
    category: 'plot',
    priority: 7,
    aliases: ['vô hạn lưu', 'vohanluu', 'unlimited flow', 'infinite flow']
  },
  {
    keyword: 'xuyen thanh vai ac',
    standardTag: 'Xuyên Thành Vai Ác',
    category: 'plot',
    priority: 8,
    aliases: ['xuyên thành vai ác', 'villain', 'xuyên vai phản diện', 'cannon fodder']
  },
  {
    keyword: 'linh di',
    standardTag: 'Linh Dị',
    category: 'plot',
    priority: 7,
    aliases: ['linh dị', 'lingdi', 'supernatural', 'thần quái', 'linh dị thần quái', 'ma quỷ']
  },
  {
    keyword: 'bao thu',
    standardTag: 'Báo Thù',
    category: 'plot',
    priority: 7,
    aliases: ['báo thù', 'baothu', 'revenge', 'trả thù', 'phục thù']
  },
  {
    keyword: 'cuu roi',
    standardTag: 'Cứu Rỗi',
    category: 'plot',
    priority: 7,
    aliases: ['cứu rỗi', 'cuuroi', 'cứu chuộc', 'cuuchuoc', 'redemption', 'atonement', 'chuộc lỗi', 'redeem']
  },
  {
    keyword: 'di nang',
    standardTag: 'Dị Năng',
    category: 'plot',
    priority: 7,
    aliases: ['dị năng', 'dinang', 'superpower', 'siêu năng lực', 'năng lực đặc biệt']
  },
  {
    keyword: 'hoan doi linh hon',
    standardTag: 'Hoán Đổi Linh Hồn',
    category: 'plot',
    priority: 6,
    aliases: ['hoán đổi linh hồn', 'chuyển đổi linh hồn', 'body swap', 'đổi thân']
  },
  {
    keyword: 'gia heo an ho',
    standardTag: 'Giả Heo Ăn Hổ',
    category: 'plot',
    priority: 7,
    aliases: ['giả heo ăn hổ', 'giaheoanho', 'hidden strength', 'ẩn thực lực', 'giấu nghề']
  },
  {
    keyword: 'va mat',
    standardTag: 'Vả Mặt',
    category: 'plot',
    priority: 7,
    aliases: ['vả mặt', 'vamat', 'face slapping', 'tát mặt']
  },
  {
    keyword: 'lam giau',
    standardTag: 'Làm Giàu',
    category: 'plot',
    priority: 6,
    aliases: ['làm giàu', 'lamgiau', 'getting rich', 'kiếm tiền']
  },
  {
    keyword: 'song trong sinh',
    standardTag: 'Song Trùng Sinh',
    category: 'plot',
    priority: 6,
    aliases: ['song trùng sinh', 'songtrongsinh', 'double rebirth', 'cả hai trùng sinh']
  },

  // ============== MỐI QUAN HỆ (RELATIONSHIP) ==============
  {
    keyword: 'thanh mai truc ma',
    standardTag: 'Thanh Mai Trúc Mã',
    category: 'relationship',
    priority: 8,
    aliases: ['thanh mai trúc mã', 'thanhmai', 'trucma', 'childhood sweethearts', 'bạn từ bé', 'quen từ nhỏ', 'trúc mã']
  },
  {
    keyword: 'nhat kien chung tinh',
    standardTag: 'Nhất Kiến Chung Tình',
    category: 'relationship',
    priority: 7,
    aliases: ['nhất kiến chung tình', 'love at first sight', 'yêu từ cái nhìn đầu tiên', 'tiếng sét ái tình']
  },
  {
    keyword: 'song huong yeu tham',
    standardTag: 'Song Hướng Yêu Thầm',
    category: 'relationship',
    priority: 7,
    aliases: ['song hướng yêu thầm', 'song hướng thầm mến', 'song hướng', 'mutual pining', 'cả hai thầm thích', 'song am']
  },
  {
    keyword: 'don huong yeu tham',
    standardTag: 'Đơn Hướng Yêu Thầm',
    category: 'relationship',
    priority: 7,
    aliases: ['đơn hướng yêu thầm', 'đơn hướng', 'one-sided love', 'yêu đơn phương', 'unrequited love']
  },
  {
    keyword: 'tinh dich thanh tinh nhan',
    standardTag: 'Tình Địch Thành Tình Nhân',
    category: 'relationship',
    priority: 7,
    aliases: ['tình địch thành tình nhân', 'enemies to lovers', 'từ tình địch thành người yêu', 'hoan hỉ oan gia']
  },
  {
    keyword: 'guong vo lai lanh',
    standardTag: 'Gương Vỡ Lại Lành',
    category: 'relationship',
    priority: 7,
    aliases: ['gương vỡ lại lành', 'guongvolailanh', 'reconciliation', 'quay lại', 'tái hợp', 'phá kính trùng viên']
  },
  {
    keyword: 'guong vo khong lanh',
    standardTag: 'Gương Vỡ Không Lành',
    category: 'relationship',
    priority: 6,
    aliases: ['gương vỡ không lành', 'không tái hợp', 'không quay lại']
  },
  {
    keyword: 'cuoi truoc yeu sau',
    standardTag: 'Cưới Trước Yêu Sau',
    category: 'relationship',
    priority: 7,
    aliases: ['cưới trước yêu sau', 'cuoitruocyeusau', 'marriage first', 'hôn trước yêu sau']
  },
  {
    keyword: 'bau truoc yeu sau',
    standardTag: 'Bầu Trước Yêu Sau',
    category: 'relationship',
    priority: 6,
    aliases: ['bầu trước yêu sau', 'mang thai trước', 'có bầu trước']
  },
  {
    keyword: 'hon nhan ngot ngao',
    standardTag: 'Hôn Nhân Ngọt Ngào',
    category: 'relationship',
    priority: 7,
    aliases: ['hôn nhân ngọt ngào', 'honnhanngotngao', 'sweet marriage', 'hạnh phúc']
  },
  {
    keyword: 'the than',
    standardTag: 'Thế Thân',
    category: 'relationship',
    priority: 6,
    aliases: ['thế thân', 'thethan', 'substitute', 'thay thế', 'bạch nguyệt quang']
  },
  {
    keyword: 'oan gia',
    standardTag: 'Oan Gia',
    category: 'relationship',
    priority: 7,
    aliases: ['oan gia', 'oanga', 'fated enemies', 'nghiệt duyên', 'hoan hỉ oan gia']
  },
  {
    keyword: 'tuong ai tuong sat',
    standardTag: 'Tương Ái Tương Sát',
    category: 'relationship',
    priority: 7,
    aliases: ['tương ái tương sát', 'love hate', 'vừa yêu vừa ghét', 'yêu nhau giết nhau', 'sát ái chứng đạo']
  },
  {
    keyword: 'cham nhiet',
    standardTag: 'Chậm Nhiệt',
    category: 'relationship',
    priority: 7,
    aliases: ['chậm nhiệt', 'chamnhiet', 'slow burn', 'từ từ', 'phát triển chậm']
  },
  {
    keyword: 'duong thanh',
    standardTag: 'Dưỡng Thành',
    category: 'relationship',
    priority: 7,
    aliases: ['dưỡng thành', 'duongthanh', 'raising', 'nuôi dưỡng', 'nuôi lớn', 'bao dưỡng']
  },
  {
    keyword: 'lau ngay sinh tinh',
    standardTag: 'Lâu Ngày Sinh Tình',
    category: 'relationship',
    priority: 6,
    aliases: ['lâu ngày sinh tình', 'launayysinhtinh', 'love over time', 'yêu dần']
  },
  {
    keyword: 'lau ngay gap lai',
    standardTag: 'Lâu Ngày Gặp Lại',
    category: 'relationship',
    priority: 6,
    aliases: ['lâu ngày gặp lại', 'reunited', 'tái ngộ', 'gặp lại sau nhiều năm']
  },
  {
    keyword: 'khe uoc tinh nhan',
    standardTag: 'Khế Ước Tình Nhân',
    category: 'relationship',
    priority: 6,
    aliases: ['khế ước tình nhân', 'contract lovers', 'hợp đồng tình nhân', 'fake relationship']
  },
  {
    keyword: 'tu gia thanh that',
    standardTag: 'Từ Giả Thành Thật',
    category: 'relationship',
    priority: 6,
    aliases: ['từ giả thành thật', 'fake to real', 'giả thành thật']
  },
  {
    keyword: 'kiep truoc kiep nay',
    standardTag: 'Kiếp Trước Kiếp Này',
    category: 'relationship',
    priority: 6,
    aliases: ['kiếp trước kiếp này', 'past life', 'tiền kiếp', 'luân hồi']
  },
  {
    keyword: 'trau gia gam co non',
    standardTag: 'Trâu Già Gặm Cỏ Non',
    category: 'relationship',
    priority: 6,
    aliases: ['trâu già gặm cỏ non', 'older partner', 'chênh lệch tuổi lớn']
  },
  {
    keyword: 'can thuy lau dai',
    standardTag: 'Cận Thủy Lâu Đài',
    category: 'relationship',
    priority: 6,
    aliases: ['cận thủy lâu đài', 'close proximity', 'gần nước thì được tưới trước']
  },
  {
    keyword: 'mat ma tim lai',
    standardTag: 'Mất Mà Tìm Lại',
    category: 'relationship',
    priority: 6,
    aliases: ['mất mà tìm lại', 'lost and found', 'tìm lại người yêu']
  },
  {
    keyword: 'duyen troi tac hop',
    standardTag: 'Duyên Trời Tác Hợp',
    category: 'relationship',
    priority: 6,
    aliases: ['duyên trời tác hợp', 'fated', 'định mệnh', 'nhân duyên']
  },
  {
    keyword: 'cam tu',
    standardTag: 'Cầm Tù',
    category: 'relationship',
    priority: 5,
    aliases: ['cầm tù', 'camtu', 'captivity', 'giam giữ', 'bắt cóc']
  },
  {
    keyword: 'cuong che ai',
    standardTag: 'Cưỡng Chế Ái',
    category: 'relationship',
    priority: 5,
    aliases: ['cưỡng chế ái', 'forced love', 'cưỡng thủ hào đoạt', 'cưỡng']
  },
  {
    keyword: 'tu hon',
    standardTag: 'Từ Hôn',
    category: 'relationship',
    priority: 6,
    aliases: ['từ hôn', 'tuhon', 'broken engagement', 'hủy hôn']
  },
  {
    keyword: 'tai hon',
    standardTag: 'Tái Hôn',
    category: 'relationship',
    priority: 6,
    aliases: ['tái hôn', 'taihon', 'remarriage', 'kết hôn lại']
  },
  {
    keyword: 'lien hon',
    standardTag: 'Liên Hôn',
    category: 'relationship',
    priority: 6,
    aliases: ['liên hôn', 'lienhon', 'political marriage', 'hôn nhân chính trị']
  },
  {
    keyword: 'the ga',
    standardTag: 'Thế Gả',
    category: 'relationship',
    priority: 6,
    aliases: ['thế gả', 'thega', 'substitute bride', 'thay thế gả']
  },
  {
    keyword: 'huynh de tinh',
    standardTag: 'Huynh Đệ Tình',
    category: 'relationship',
    priority: 6,
    aliases: ['huynh đệ tình', 'brotherhood romance', 'tình anh em']
  },
  {
    keyword: 'ban cung phong',
    standardTag: 'Bạn Cùng Phòng',
    category: 'relationship',
    priority: 6,
    aliases: ['bạn cùng phòng', 'bancungphong', 'roommates', 'ở chung']
  },
  {
    keyword: 'cap tren cap duoi',
    standardTag: 'Cấp Trên Cấp Dưới',
    category: 'relationship',
    priority: 6,
    aliases: ['cấp trên cấp dưới', 'boss employee', 'sếp nhân viên', 'superior subordinate']
  },
  {
    keyword: 'phao huu',
    standardTag: 'Pháo Hữu',
    category: 'relationship',
    priority: 5,
    aliases: ['pháo hữu', 'phaohuu', 'friends with benefits', 'bạn tình']
  },
  {
    keyword: 'vong luyen',
    standardTag: 'Võng Luyến',
    category: 'relationship',
    priority: 6,
    aliases: ['võng luyến', 'vongluyen', 'online romance', 'tình yêu online']
  },

  // ============== COUPLE ==============
  {
    keyword: '1v1',
    standardTag: '1v1',
    category: 'couple',
    priority: 10,
    aliases: ['1x1', '1×1', 'một đôi một', 'chuyên nhất', 'exclusive', 'nhất công nhất thụ']
  },
  {
    keyword: 'np',
    standardTag: 'NP',
    category: 'couple',
    priority: 8,
    aliases: ['nhiều cp', 'nhiều công', 'nhiều thụ', 'đa phu', 'harem', 'reverse harem', 'nhiều CP']
  },
  {
    keyword: '3p',
    standardTag: '3P',
    category: 'couple',
    priority: 7,
    aliases: ['threesome', 'ba người']
  },
  {
    keyword: '4p',
    standardTag: '4P',
    category: 'couple',
    priority: 7,
    aliases: ['foursome', 'bốn người']
  },
  {
    keyword: 'non cp',
    standardTag: 'Non CP',
    category: 'couple',
    priority: 6,
    aliases: ['noncp', 'không cp', 'no couple', 'không couple']
  },
  {
    keyword: 'cuong cuong',
    standardTag: 'Cường Cường',
    category: 'couple',
    priority: 8,
    aliases: ['cường cường', 'cuongcuong', 'cường x cường', 'strong x strong']
  },
  {
    keyword: 'cuong nhuoc',
    standardTag: 'Cường Nhược',
    category: 'couple',
    priority: 7,
    aliases: ['cường nhược', 'cuongnhuoc', 'strong x weak']
  },
  {
    keyword: 'nhuoc cuong',
    standardTag: 'Nhược Cường',
    category: 'couple',
    priority: 7,
    aliases: ['nhược cường', 'nhuoccuong', 'weak x strong']
  },
  {
    keyword: 'ho cong',
    standardTag: 'Hỗ Công',
    category: 'couple',
    priority: 7,
    aliases: ['hỗ công', 'hocong', 'reversible', 'đổi vai', 'switch', 'đổi công', 'doicong', 'switch top']
  },
  {
    keyword: 'song khiet',
    standardTag: 'Song Khiết',
    category: 'couple',
    priority: 8,
    aliases: ['song khiết', 'songkhiet', 'both virgin', 'cả hai đều trong trắng', 'song xử', 'song trinh']
  },
  {
    keyword: 'phi song khiet',
    standardTag: 'Phi Song Khiết',
    category: 'couple',
    priority: 6,
    aliases: ['phi song khiết', 'phisongkhiet', 'not both virgin']
  },
  {
    keyword: 'tu cong tu thu',
    standardTag: 'Tự Công Tự Thụ',
    category: 'couple',
    priority: 6,
    aliases: ['tự công tự thụ', 'selfcest', 'tự x tự', 'tư công tự thụ']
  },
  {
    keyword: 'nien ha',
    standardTag: 'Niên Hạ',
    category: 'couple',
    priority: 8,
    aliases: ['niên hạ', 'nienha', 'tuổi dưới', 'younger', 'công trẻ hơn']
  },
  {
    keyword: 'nien thuong',
    standardTag: 'Niên Thượng',
    category: 'couple',
    priority: 8,
    aliases: ['niên thượng', 'nienthuong', 'tuổi trên', 'older', 'công già hơn']
  },
  {
    keyword: 'huynh de',
    standardTag: 'Huynh Đệ',
    category: 'couple',
    priority: 6,
    aliases: ['huynh đệ', 'huynhde', 'brothers', 'anh em']
  },
  {
    keyword: 'huynh muoi',
    standardTag: 'Huynh Muội',
    category: 'couple',
    priority: 6,
    aliases: ['huynh muội', 'huynhmuoi', 'brother sister', 'anh em khác giới']
  },
  {
    keyword: 'phu tu',
    standardTag: 'Phụ Tử',
    category: 'couple',
    priority: 5,
    aliases: ['phụ tử', 'phutu', 'father son', 'cha con']
  },
  {
    keyword: 'mau tu',
    standardTag: 'Mẫu Tử',
    category: 'couple',
    priority: 5,
    aliases: ['mẫu tử', 'mautu', 'mother son', 'mẹ con']
  },
  {
    keyword: 'su do',
    standardTag: 'Sư Đồ',
    category: 'couple',
    priority: 6,
    aliases: ['sư đồ', 'sudo', 'master disciple', 'thầy trò', 'sư đệ']
  },
  {
    keyword: 'chu bo',
    standardTag: 'Chủ Bộc',
    category: 'couple',
    priority: 6,
    aliases: ['chủ bộc', 'chuboc', 'master servant', 'chủ tớ']
  },

  // ============== NHÂN VẬT (CHARACTER) ==============
  {
    keyword: 'chu cong',
    standardTag: 'Chủ Công',
    category: 'character',
    priority: 8,
    aliases: ['chủ công', 'chucong', 'gong', 'top pov', 'góc nhìn công']
  },
  {
    keyword: 'chu thu',
    standardTag: 'Chủ Thụ',
    category: 'character',
    priority: 8,
    aliases: ['chủ thụ', 'chuthu', 'shou', 'bottom pov', 'góc nhìn thụ']
  },
  {
    keyword: 'cuong cong',
    standardTag: 'Cường Công',
    category: 'character',
    priority: 8,
    aliases: ['cường công', 'cuongcong', 'strong gong', 'công mạnh mẽ']
  },
  {
    keyword: 'cuong thu',
    standardTag: 'Cường Thụ',
    category: 'character',
    priority: 8,
    aliases: ['cường thụ', 'cuongthu', 'strong shou', 'thụ mạnh mẽ']
  },
  {
    keyword: 'nhuoc cong',
    standardTag: 'Nhược Công',
    category: 'character',
    priority: 7,
    aliases: ['nhược công', 'nhuoccong', 'weak gong', 'công yếu']
  },
  {
    keyword: 'nhuoc thu',
    standardTag: 'Nhược Thụ',
    category: 'character',
    priority: 7,
    aliases: ['nhược thụ', 'nhuocthu', 'weak shou', 'thụ yếu', 'yếu thụ']
  },
  {
    keyword: 'my cong',
    standardTag: 'Mỹ Công',
    category: 'character',
    priority: 7,
    aliases: ['mỹ công', 'mycong', 'beautiful gong', 'công đẹp trai']
  },
  {
    keyword: 'my thu',
    standardTag: 'Mỹ Thụ',
    category: 'character',
    priority: 7,
    aliases: ['mỹ thụ', 'mythu', 'beautiful shou', 'thụ xinh đẹp']
  },
  {
    keyword: 'tra cong',
    standardTag: 'Tra Công',
    category: 'character',
    priority: 7,
    aliases: ['tra công', 'tracong', 'scum gong', 'công tra', 'công tệ bạc']
  },
  {
    keyword: 'tra thu',
    standardTag: 'Tra Thụ',
    category: 'character',
    priority: 7,
    aliases: ['tra thụ', 'trathu', 'scum shou', 'thụ tra', 'thụ tệ bạc']
  },
  {
    keyword: 'tien cong',
    standardTag: 'Tiên Công',
    category: 'character',
    priority: 7,
    aliases: ['tiên công', 'tiencong', 'kind gong', 'công hiền lành']
  },
  {
    keyword: 'tien thu',
    standardTag: 'Tiên Thụ',
    category: 'character',
    priority: 7,
    aliases: ['tiên thụ', 'tienthu', 'kind shou', 'thụ hiền lành']
  },
  {
    keyword: 'ba dao tong tai',
    standardTag: 'Bá Đạo Tổng Tài',
    category: 'character',
    priority: 8,
    aliases: ['bá đạo tổng tài', 'badaotongtai', 'ceo', 'tổng tài', 'boss', 'dominant ceo', 'tổng tài thụ']
  },
  {
    keyword: 'phuc hac',
    standardTag: 'Phúc Hắc',
    category: 'character',
    priority: 7,
    aliases: ['phúc hắc', 'phuchac', 'black belly', 'bụng đen', 'độc ác']
  },
  {
    keyword: 'lang tu',
    standardTag: 'Lãng Tử',
    category: 'character',
    priority: 6,
    aliases: ['lãng tử', 'langtu', 'playboy', 'đào hoa', 'công phong lưu']
  },
  {
    keyword: 'phao hoi',
    standardTag: 'Pháo Hôi',
    category: 'character',
    priority: 7,
    aliases: ['pháo hôi', 'phaohoi', 'cannon fodder', 'vai phụ', 'nhân vật bị hy sinh']
  },
  {
    keyword: 'benh kieu',
    standardTag: 'Bệnh Kiều',
    category: 'character',
    priority: 7,
    aliases: ['bệnh kiều', 'benhkieu', 'sickly beauty', 'bệnh nhược', 'yếu ớt']
  },
  {
    keyword: 'yandere',
    standardTag: 'Yandere',
    category: 'character',
    priority: 7,
    aliases: ['yandere', 'điên tình', 'bệnh hoạn', 'ám ảnh', 'possessive']
  },
  {
    keyword: 'bang son',
    standardTag: 'Băng Sơn',
    category: 'character',
    priority: 6,
    aliases: ['băng sơn', 'bangson', 'cold beauty', 'lạnh lùng', 'cao lãnh']
  },
  {
    keyword: 'cao lanh',
    standardTag: 'Cao Lãnh',
    category: 'character',
    priority: 6,
    aliases: ['cao lãnh', 'caolanh', 'cold', 'lạnh lùng', 'cool']
  },
  {
    keyword: 'ngu ngoc',
    standardTag: 'Ngu Ngốc',
    category: 'character',
    priority: 5,
    aliases: ['ngu ngốc', 'ngungoc', 'dumb', 'ngốc nghếch', 'đần']
  },
  {
    keyword: 'thong minh',
    standardTag: 'Thông Minh',
    category: 'character',
    priority: 6,
    aliases: ['thông minh', 'thongminh', 'smart', 'khôn ngoan', 'thông thái']
  },

  // ============== NỘI DUNG (CONTENT) ==============
  {
    keyword: '18+',
    standardTag: '18+',
    category: 'content',
    priority: 8,
    aliases: ['18+', 'smut', 'h văn', 'hvan', 'h', 'cao h', 'caoh', 'nc17', 'nc-17', 'nc18', 'nc-18', 'r18', 'r-18', 
              'adult', 'explicit', 'lemon', 'lime', 'mature', 'nsfw', 'nội dung người lớn']
  },
  {
    keyword: 'thanh thuy van',
    standardTag: 'Thanh Thủy Văn',
    category: 'content',
    priority: 6,
    aliases: ['thanh thủy văn', 'thanhthuyvan', 'no smut', 'không có h', 'clean']
  },
  {
    keyword: 'cuong che',
    standardTag: 'Cưỡng Chế',
    category: 'content',
    priority: 6,
    aliases: ['cưỡng chế', 'cuongche', 'forced', 'cưỡng', 'dubcon', 'noncon']
  },
  {
    keyword: 'tam quan bat chinh',
    standardTag: 'Tam Quan Bất Chính',
    category: 'content',
    priority: 6,
    aliases: ['tam quan bất chính', 'tamquanbatchinh', 'morally gray', 'toxic']
  },
  {
    keyword: 'tinh huu doc chung',
    standardTag: 'Tình Hữu Độc Chung',
    category: 'content',
    priority: 6,
    aliases: ['tình hữu độc chung', 'tinhhuudocchung', 'toxic love', 'yêu đến độc']
  },
  {
    keyword: 'ntr',
    standardTag: 'NTR',
    category: 'content',
    priority: 6,
    aliases: ['ngoại tình', 'netorare', 'cheating', 'cắm sừng']
  },
  {
    keyword: 'luan loan',
    standardTag: 'Luân Loạn',
    category: 'content',
    priority: 5,
    aliases: ['luân loạn', 'incest', 'côn trùng', 'cấm kỵ', 'l luân']
  },
  {
    keyword: 'sinh con',
    standardTag: 'Sinh Con',
    category: 'content',
    priority: 6,
    aliases: ['sinh con', 'sinhcon', 'mpreg', 'nam mang thai', 'có em bé', 'công sinh con']
  },
  {
    keyword: 'sinh tu',
    standardTag: 'Sinh Tử',
    category: 'content',
    priority: 7,
    aliases: ['sinh tử', 'sinhtu', 'sinh tu', 'life and death', 'sống chết', 'sinh tử văn']
  },
  {
    keyword: 'sm',
    standardTag: 'SM',
    category: 'content',
    priority: 5,
    aliases: ['sm', 'bdsm', 'sadism', 'masochism']
  },
  {
    keyword: 'pua',
    standardTag: 'PUA',
    category: 'content',
    priority: 5,
    aliases: ['pua', 'pick up artist', 'tẩy não', 'thao túng']
  },
  {
    keyword: 'ptsd',
    standardTag: 'PTSD',
    category: 'content',
    priority: 5,
    aliases: ['ptsd', 'trauma', 'sang chấn', 'chấn thương tâm lý']
  },
  {
    keyword: 'tham men',
    standardTag: 'Thầm Mến',
    category: 'content',
    priority: 7,
    aliases: ['thầm mến', 'thammen', 'secret crush', 'thầm thích', 'crush', 'yêu thầm']
  },
  {
    keyword: 'truong thanh',
    standardTag: 'Trưởng Thành',
    category: 'content',
    priority: 6,
    aliases: ['trưởng thành', 'truongthanh', 'coming of age', 'grow up']
  },
  {
    keyword: 'thu truy cong',
    standardTag: 'Thụ Truy Công',
    category: 'content',
    priority: 7,
    aliases: ['thụ truy công', 'thutruycong', 'shou chases gong', 'thụ đuổi theo công']
  },
  {
    keyword: 'tinh dau y hop',
    standardTag: 'Tình Đầu Ý Hợp',
    category: 'content',
    priority: 6,
    aliases: ['tình đầu ý hợp', 'tinhdauyyhop', 'mutual first love', 'đầu tiên của nhau']
  },

  // ============== BỔ SUNG - GENRE (Phong cách) ==============
  {
    keyword: 'tinh cam',
    standardTag: 'Tình Cảm',
    category: 'genre',
    priority: 8,
    aliases: ['tình cảm', 'tinhcam', 'romance', 'tình yêu', 'tinh yeu']
  },
  {
    keyword: 'lang man',
    standardTag: 'Lãng Mạn',
    category: 'genre',
    priority: 7,
    aliases: ['lãng mạn', 'langman', 'romantic', 'romance']
  },
  {
    keyword: 'ngot ngao',
    standardTag: 'Ngọt Ngào',
    category: 'genre',
    priority: 7,
    aliases: ['ngọt ngào', 'ngotngao', 'ngọt văn', 'ngot van', 'sweet']
  },
  {
    keyword: 'dien van',
    standardTag: 'Điền Văn',
    category: 'genre',
    priority: 6,
    aliases: ['điền văn', 'dienvan', 'farming', 'điền viên', 'làm nông', 'trồng trọt']
  },

  // ============== BỔ SUNG - SETTING (Bối cảnh) ==============
  {
    keyword: 'do thi tinh duyen',
    standardTag: 'Đô Thị Tình Duyên',
    category: 'setting',
    priority: 7,
    aliases: ['đô thị tình duyên', 'dothitinhduyen', 'urban romance']
  },
  {
    keyword: 'hac bang',
    standardTag: 'Hắc Bang',
    category: 'setting',
    priority: 7,
    aliases: ['hắc bang', 'hacbang', 'mafia', 'gang', 'xã hội đen', 'băng đảng']
  },
  {
    keyword: 'my thuc',
    standardTag: 'Mỹ Thực',
    category: 'setting',
    priority: 6,
    aliases: ['mỹ thực', 'mythuc', 'food', 'culinary', 'ẩm thực', 'nấu ăn', 'đầu bếp']
  },
  {
    keyword: 'lich su',
    standardTag: 'Lịch Sử',
    category: 'setting',
    priority: 6,
    aliases: ['lịch sử', 'lichsu', 'history', 'historical']
  },
  {
    keyword: 'hai dao',
    standardTag: 'Hải Đảo',
    category: 'setting',
    priority: 5,
    aliases: ['hải đảo', 'haidao', 'island', 'đảo']
  },

  // ============== BỔ SUNG - WORLD (Thế giới) ==============
  {
    keyword: 'thu nhan',
    standardTag: 'Thú Nhân',
    category: 'world',
    priority: 7,
    aliases: ['thú nhân', 'thunhan', 'beast people', 'kemonomimi', 'người thú']
  },
  {
    keyword: 'long toc',
    standardTag: 'Long Tộc',
    category: 'world',
    priority: 6,
    aliases: ['long tộc', 'longtoc', 'dragon', 'rồng']
  },
  {
    keyword: 'huyet toc',
    standardTag: 'Huyết Tộc',
    category: 'world',
    priority: 6,
    aliases: ['huyết tộc', 'huyettoc', 'vampire', 'ma cà rồng']
  },
  {
    keyword: 'than tien yeu quai',
    standardTag: 'Thần Tiên Yêu Quái',
    category: 'world',
    priority: 6,
    aliases: ['thần tiên yêu quái', 'thantien', 'gods demons', 'tiên', 'yêu quái']
  },
  {
    keyword: 'co giap',
    standardTag: 'Cơ Giáp',
    category: 'world',
    priority: 6,
    aliases: ['cơ giáp', 'cogiap', 'mecha', 'robot']
  },
  {
    keyword: 'tay huyen',
    standardTag: 'Tây Huyễn',
    category: 'world',
    priority: 6,
    aliases: ['tây huyễn', 'tayhuyen', 'western fantasy', 'fantasy phương tây']
  },
  {
    keyword: 'ma phap',
    standardTag: 'Ma Pháp',
    category: 'world',
    priority: 6,
    aliases: ['ma pháp', 'maphap', 'magic', 'phép thuật']
  },
  {
    keyword: 'nam nam the gioi',
    standardTag: 'Nam Nam Thế Giới',
    category: 'world',
    priority: 5,
    aliases: ['nam nam thế giới', 'namnamthegioi', 'all male world', 'thế giới toàn nam']
  },
  {
    keyword: 'the gioi song song',
    standardTag: 'Thế Giới Song Song',
    category: 'world',
    priority: 5,
    aliases: ['thế giới song song', 'parallel world', 'parallel universe']
  },
  {
    keyword: 'cthulhu',
    standardTag: 'Cthulhu',
    category: 'world',
    priority: 5,
    aliases: ['cthulhu', 'lovecraft', 'cosmic horror']
  },
  {
    keyword: 'than thoai',
    standardTag: 'Thần Thoại',
    category: 'world',
    priority: 5,
    aliases: ['thần thoại', 'thanthoai', 'mythology', 'thần']
  },
  {
    keyword: 'hong hoang',
    standardTag: 'Hồng Hoang',
    category: 'world',
    priority: 5,
    aliases: ['hồng hoang', 'honghoang', 'primordial', 'hồng hoang thời đại']
  },

  // ============== BỔ SUNG - CHARACTER (Nhân vật) ==============
  {
    keyword: 'on nhu cong',
    standardTag: 'Ôn Nhu Công',
    category: 'character',
    priority: 7,
    aliases: ['ôn nhu công', 'onnhucong', 'gentle gong', 'công hiền lành']
  },
  {
    keyword: 'cong sung thu',
    standardTag: 'Công Sủng Thụ',
    category: 'character',
    priority: 7,
    aliases: ['công sủng thụ', 'congsungthu', 'gong pampers shou']
  },
  {
    keyword: 'thu sung cong',
    standardTag: 'Thụ Sủng Công',
    category: 'character',
    priority: 7,
    aliases: ['thụ sủng công', 'thusungcong', 'shou pampers gong']
  },
  {
    keyword: 'ba dao cong',
    standardTag: 'Bá Đạo Công',
    category: 'character',
    priority: 7,
    aliases: ['bá đạo công', 'badaocong', 'domineering gong', 'công bá đạo']
  },
  {
    keyword: 'phuc hac cong',
    standardTag: 'Phúc Hắc Công',
    category: 'character',
    priority: 7,
    aliases: ['phúc hắc công', 'phuchaccong', 'black belly gong']
  },
  {
    keyword: 'dai cong',
    standardTag: 'Đại Công',
    category: 'character',
    priority: 6,
    aliases: ['đại công', 'daicong', 'big gong']
  },
  {
    keyword: 'dai thuc thu',
    standardTag: 'Đại Thúc Thụ',
    category: 'character',
    priority: 6,
    aliases: ['đại thúc thụ', 'daithucthu', 'uncle shou', 'thụ lớn tuổi']
  },
  {
    keyword: 'thu da cong',
    standardTag: 'Thụ Dạ Công',
    category: 'character',
    priority: 6,
    aliases: ['thụ dạ công', 'thudacong', 'older shou']
  },
  {
    keyword: 'lanh dam cong',
    standardTag: 'Lạnh Đạm Công',
    category: 'character',
    priority: 6,
    aliases: ['lạnh đạm công', 'lanhdamcong', 'cold gong']
  },
  {
    keyword: 'lanh dam thu',
    standardTag: 'Lạnh Đạm Thụ',
    category: 'character',
    priority: 6,
    aliases: ['lạnh đạm thụ', 'lanhdamthu', 'cold shou']
  },
  {
    keyword: 'cao lanh thu',
    standardTag: 'Cao Lãnh Thụ',
    category: 'character',
    priority: 6,
    aliases: ['cao lãnh thụ', 'caolanhthu', 'aloof shou']
  },
  {
    keyword: 'binh pham thu',
    standardTag: 'Bình Phàm Thụ',
    category: 'character',
    priority: 6,
    aliases: ['bình phàm thụ', 'binhphamthu', 'ordinary shou', 'thụ bình thường']
  },
  {
    keyword: 'binh pham cong',
    standardTag: 'Bình Phàm Công',
    category: 'character',
    priority: 6,
    aliases: ['bình phàm công', 'binhphamcong', 'ordinary gong', 'công bình thường']
  },
  {
    keyword: 'ngay tho',
    standardTag: 'Ngây Thơ',
    category: 'character',
    priority: 6,
    aliases: ['ngây thơ', 'ngaytho', 'innocent', 'naive', 'ngây thơ thụ']
  },
  {
    keyword: 'nhan ngu',
    standardTag: 'Nhân Ngư',
    category: 'character',
    priority: 5,
    aliases: ['nhân ngư', 'nhanngu', 'mermaid', 'merman', 'người cá']
  },
  {
    keyword: 'minh tinh',
    standardTag: 'Minh Tinh',
    category: 'character',
    priority: 6,
    aliases: ['minh tinh', 'minhtinh', 'celebrity', 'star', 'ngôi sao']
  },
  {
    keyword: 'bac si',
    standardTag: 'Bác Sĩ',
    category: 'character',
    priority: 5,
    aliases: ['bác sĩ', 'bacsi', 'doctor', 'y sĩ']
  },

  // ============== BỔ SUNG - COUPLE ==============
  {
    keyword: 'song tinh',
    standardTag: 'Song Tính',
    category: 'couple',
    priority: 6,
    aliases: ['song tính', 'songtinh', 'bisexual', 'bi']
  },
  {
    keyword: 'cap doi',
    standardTag: 'Cặp Đôi',
    category: 'couple',
    priority: 5,
    aliases: ['cặp đôi', 'capdoi', 'couple']
  },
  {
    keyword: 'song sinh',
    standardTag: 'Song Sinh',
    category: 'couple',
    priority: 5,
    aliases: ['song sinh', 'songsinh', 'twins', 'sinh đôi']
  },

  // ============== BỔ SUNG - PLOT (Xu hướng) ==============
  {
    keyword: 'trong sinh',
    standardTag: 'Trọng Sinh',
    category: 'plot',
    priority: 9,
    aliases: ['trọng sinh', 'trongsinh', 'rebirth', 'reborn']
  },
  {
    keyword: 'linh di than quai',
    standardTag: 'Linh Dị Thần Quái',
    category: 'plot',
    priority: 7,
    aliases: ['linh dị thần quái', 'linhdithangquai', 'supernatural horror', 'thần quái']
  },
  {
    keyword: 'cuu chuoc',
    standardTag: 'Cứu Chuộc',
    category: 'plot',
    priority: 6,
    aliases: ['cứu chuộc', 'cuuchuoc', 'redemption']
  },
  {
    keyword: 'tuy than khong gian',
    standardTag: 'Tùy Thân Không Gian',
    category: 'plot',
    priority: 6,
    aliases: ['tùy thân không gian', 'tuythankhonggian', 'portable space', 'không gian tùy thân']
  },
  {
    keyword: 'co xuyen kim',
    standardTag: 'Cổ Xuyên Kim',
    category: 'plot',
    priority: 6,
    aliases: ['cổ xuyên kim', 'coxuyenkim', 'ancient to modern', 'từ cổ đại đến hiện đại']
  },
  {
    keyword: 'song xuyen',
    standardTag: 'Song Xuyên',
    category: 'plot',
    priority: 6,
    aliases: ['song xuyên', 'songxuyen', 'double transmigration', 'cả hai cùng xuyên']
  },
  {
    keyword: 'chet di song lai',
    standardTag: 'Chết Đi Sống Lại',
    category: 'plot',
    priority: 6,
    aliases: ['chết đi sống lại', 'chetdisonglai', 'death and revival']
  },
  {
    keyword: 'qua lai thoi khong',
    standardTag: 'Qua Lại Thời Không',
    category: 'plot',
    priority: 5,
    aliases: ['qua lại thời không', 'qualaithkhong', 'time loop']
  },
  {
    keyword: 'app',
    standardTag: 'App',
    category: 'plot',
    priority: 5,
    aliases: ['app', 'ứng dụng', 'application']
  },

  // ============== BỔ SUNG - RELATIONSHIP (Mối quan hệ) ==============
  {
    keyword: 'song huong',
    standardTag: 'Song Hướng',
    category: 'relationship',
    priority: 6,
    aliases: ['song hướng', 'songhuong', 'mutual crush', 'two-way']
  },
  {
    keyword: 'don huong',
    standardTag: 'Đơn Hướng',
    category: 'relationship',
    priority: 6,
    aliases: ['đơn hướng', 'donhuong', 'one-sided', 'unrequited']
  },
  {
    keyword: 'tinh dich bien cp',
    standardTag: 'Tình Địch Biến CP',
    category: 'relationship',
    priority: 6,
    aliases: ['tình địch biến cp', 'tinhdichhiencp', 'rival to lover']
  },
  {
    keyword: 'truy thu',
    standardTag: 'Truy Thụ',
    category: 'relationship',
    priority: 6,
    aliases: ['truy thụ', 'truythu', 'chasing shou', 'đuổi theo thụ']
  },
  {
    keyword: 'tai hop',
    standardTag: 'Tái Hợp',
    category: 'relationship',
    priority: 6,
    aliases: ['tái hợp', 'taihop', 'reunion', 'getting back together']
  },
  {
    keyword: 'hieu lam',
    standardTag: 'Hiểu Lầm',
    category: 'relationship',
    priority: 5,
    aliases: ['hiểu lầm', 'hieulam', 'misunderstanding']
  },

  // ============== BỔ SUNG - CONTENT (Nội dung) ==============
  {
    keyword: 'tho tuc',
    standardTag: 'Thô Tục',
    category: 'content',
    priority: 5,
    aliases: ['thô tục', 'thotuc', 'vulgar', 'crude', 'thô']
  },
  {
    keyword: 'cuong ap',
    standardTag: 'Cưỡng Ép',
    category: 'content',
    priority: 5,
    aliases: ['cưỡng ép', 'cuongep', 'forced', 'ép buộc']
  },
  {
    keyword: 'chut nguoc',
    standardTag: 'Chút Ngược',
    category: 'content',
    priority: 5,
    aliases: ['chút ngược', 'chutnguoc', 'slight angst', 'hơi ngược']
  },

  // ============== BỔ SUNG - OTHER (POV, Format) ==============
  {
    keyword: 'ngoi thu nhat',
    standardTag: 'Ngôi Thứ Nhất',
    category: 'other',
    priority: 5,
    aliases: ['ngôi thứ nhất', 'ngoithunhat', 'first person pov', 'tôi']
  },
  {
    keyword: 'song thi giac',
    standardTag: 'Song Thị Giác',
    category: 'other',
    priority: 5,
    aliases: ['song thị giác', 'songthigiac', 'dual pov', 'hai góc nhìn']
  },
  {
    keyword: 'truyen dai',
    standardTag: 'Truyện Dài',
    category: 'other',
    priority: 5,
    aliases: ['truyện dài', 'truyendai', 'long story', 'trường thiên']
  },

  // ============== BỔ SUNG - Thêm nhiều tag phổ biến khác ==============
  {
    keyword: 'phat song truc tiep',
    standardTag: 'Phát Sóng Trực Tiếp',
    category: 'setting',
    priority: 6,
    aliases: ['phát sóng trực tiếp', 'phatsongtrucriep', 'livestream', 'live broadcast', 'streaming']
  },
  {
    keyword: 'vong phoi',
    standardTag: 'Võng Phối',
    category: 'setting',
    priority: 5,
    aliases: ['võng phối', 'vongphoi', 'online dating', 'internet couple']
  },
  {
    keyword: 'duong oa',
    standardTag: 'Dưỡng Oa',
    category: 'content',
    priority: 5,
    aliases: ['dưỡng oa', 'duongoa', 'raising baby', 'nuôi con', 'có con']
  },
  {
    keyword: 'khoa cu',
    standardTag: 'Khoa Cử',
    category: 'setting',
    priority: 5,
    aliases: ['khoa cử', 'khoacu', 'imperial exam', 'thi cử']
  },
  {
    keyword: 'tam giao cuu luu',
    standardTag: 'Tam Giáo Cửu Lưu',
    category: 'setting',
    priority: 5,
    aliases: ['tam giáo cửu lưu', 'tamgiaocuuluu', 'jianghu sects']
  },
  {
    keyword: 'chuc truong',
    standardTag: 'Chức Trường',
    category: 'setting',
    priority: 5,
    aliases: ['chức trường', 'chuctruong', 'workplace', 'office']
  },
  {
    keyword: 'trom mo',
    standardTag: 'Trộm Mộ',
    category: 'setting',
    priority: 5,
    aliases: ['trộm mộ', 'trommo', 'tomb raiding', 'đào mộ']
  },
  {
    keyword: 'phong thuy',
    standardTag: 'Phong Thủy',
    category: 'setting',
    priority: 5,
    aliases: ['phong thủy', 'phongthuy', 'feng shui', 'geomancy']
  },
  {
    keyword: 'y thuat',
    standardTag: 'Y Thuật',
    category: 'setting',
    priority: 5,
    aliases: ['y thuật', 'ythuat', 'medicine', 'y học', 'chữa bệnh']
  },
  {
    keyword: 'viet van',
    standardTag: 'Viết Văn',
    category: 'setting',
    priority: 5,
    aliases: ['viết văn', 'vietvan', 'writing', 'tác giả', 'nhà văn']
  },
  {
    keyword: 'lu hanh',
    standardTag: 'Lữ Hành',
    category: 'setting',
    priority: 5,
    aliases: ['lữ hành', 'luhanh', 'travel', 'du lịch', 'mạo hiểm']
  },
  {
    keyword: 'the thao',
    standardTag: 'Thể Thao',
    category: 'setting',
    priority: 5,
    aliases: ['thể thao', 'thethao', 'sports', 'vận động viên']
  },
  {
    keyword: 'suy luan',
    standardTag: 'Suy Luận',
    category: 'genre',
    priority: 5,
    aliases: ['suy luận', 'suyluan', 'deduction', 'logic', 'reasoning']
  },
  {
    keyword: 'thoi mien',
    standardTag: 'Thôi Miên',
    category: 'plot',
    priority: 5,
    aliases: ['thôi miên', 'thoimien', 'hypnosis', 'mind control']
  },
  {
    keyword: 'tien tri',
    standardTag: 'Tiên Tri',
    category: 'plot',
    priority: 5,
    aliases: ['tiên tri', 'tientri', 'prophecy', 'prediction', 'dự đoán']
  },
  {
    keyword: 'tien hoa',
    standardTag: 'Tiến Hóa',
    category: 'plot',
    priority: 5,
    aliases: ['tiến hóa', 'tienhoa', 'evolution', 'evolve']
  },
  {
    keyword: 'do thach',
    standardTag: 'Đồ Thạch',
    category: 'setting',
    priority: 5,
    aliases: ['đồ thạch', 'dothach', 'stone gambling', 'đánh đá']
  },
  {
    keyword: 'thien tai',
    standardTag: 'Thiên Tài',
    category: 'character',
    priority: 5,
    aliases: ['thiên tài', 'thientai', 'genius', 'prodigy']
  },
  {
    keyword: 'vong hong',
    standardTag: 'Võng Hồng',
    category: 'setting',
    priority: 5,
    aliases: ['võng hồng', 'vonghong', 'internet celebrity', 'influencer', 'KOL']
  },
  {
    keyword: 'gioi thoi trang',
    standardTag: 'Giới Thời Trang',
    category: 'setting',
    priority: 5,
    aliases: ['giới thời trang', 'gioithoitrang', 'fashion industry', 'model', 'người mẫu']
  },

  // ============== BỔ SUNG - 41 TAG CÒN LẠI ==============
  
  // Genre
  {
    keyword: 'ngot van',
    standardTag: 'Ngọt Văn',
    category: 'genre',
    priority: 7,
    aliases: ['ngọt văn', 'ngotvan', 'sweet story', 'văn ngọt']
  },
  {
    keyword: 'tinh yeu',
    standardTag: 'Tình Yêu',
    category: 'genre',
    priority: 7,
    aliases: ['tình yêu', 'tinhyeu', 'love', 'romance']
  },
  {
    keyword: 'quan van',
    standardTag: 'Quần Văn',
    category: 'genre',
    priority: 5,
    aliases: ['quần văn', 'quanvan', 'ensemble', 'group story']
  },

  // Character
  {
    keyword: 'tong tai',
    standardTag: 'Tổng Tài',
    category: 'character',
    priority: 7,
    aliases: ['tổng tài', 'tongtai', 'ceo', 'tổng giám đốc', 'boss']
  },
  {
    keyword: 'yeu thu',
    standardTag: 'Yếu Thụ',
    category: 'character',
    priority: 6,
    aliases: ['yếu thụ', 'yeuthu', 'weak shou', 'thụ yếu đuối']
  },
  {
    keyword: 'hoa quy',
    standardTag: 'Hoa Quý',
    category: 'character',
    priority: 5,
    aliases: ['hoa quý', 'hoaquy', 'precious flower', 'quý tộc hoa']
  },

  // Couple
  {
    keyword: 'thu nhieu cong',
    standardTag: 'Thụ Đa Công',
    category: 'couple',
    priority: 6,
    aliases: ['thụ đa công', 'thudacong', 'thu da cong', 'one shou many gongs', 'nhiều công một thụ', '1 thụ nhiều công']
  },
  {
    keyword: 'doi cong',
    standardTag: 'Đổi Công',
    category: 'couple',
    priority: 6,
    aliases: ['đổi công', 'doicong', 'switch', 'reversible', 'hoán đổi', 'có thể đổi']
  },
  {
    keyword: 'chu to',
    standardTag: 'Chủ Tớ',
    category: 'couple',
    priority: 6,
    aliases: ['chủ tớ', 'chuto', 'master servant', 'chủ nhân', 'tôi tớ']
  },

  // Relationship
  {
    keyword: 'nhan duyen',
    standardTag: 'Nhân Duyên',
    category: 'relationship',
    priority: 6,
    aliases: ['nhân duyên', 'nhanduyen', 'fate', 'destined', 'duyên phận']
  },
  {
    keyword: 'song huong tham men',
    standardTag: 'Song Hướng Thầm Mến',
    category: 'relationship',
    priority: 6,
    aliases: ['song hướng thầm mến', 'songhuongthammen', 'mutual secret crush']
  },
  {
    keyword: 'truy the',
    standardTag: 'Truy Thê',
    category: 'relationship',
    priority: 6,
    aliases: ['truy thê', 'truythe', 'chasing wife', 'đuổi theo vợ']
  },

  // World
  {
    keyword: 'di the',
    standardTag: 'Dị Thế',
    category: 'world',
    priority: 6,
    aliases: ['dị thế', 'dithe', 'different world', 'thế giới khác']
  },

  // Setting
  {
    keyword: 'che tac',
    standardTag: 'Chế Tác',
    category: 'setting',
    priority: 5,
    aliases: ['chế tác', 'chetac', 'crafting', 'làm đồ', 'rèn']
  },
  {
    keyword: 'boi canh',
    standardTag: 'Bối Cảnh',
    category: 'setting',
    priority: 5,
    aliases: ['bối cảnh', 'boicanh', 'setting', 'background']
  },

  // Content
  {
    keyword: 'incest',
    standardTag: 'Incest',
    category: 'content',
    priority: 4,
    aliases: ['incest', 'loạn luân', 'cận huyết']
  },
  {
    keyword: 'thu cung',
    standardTag: 'Thú Cưng',
    category: 'content',
    priority: 5,
    aliases: ['thú cưng', 'thucung', 'pet', 'vật nuôi', 'chó', 'mèo']
  },

  // Other / Type
  {
    keyword: 'hoan thanh',
    standardTag: 'Hoàn Thành',
    category: 'other',
    priority: 5,
    aliases: ['hoàn thành', 'hoanthanh', 'completed', 'full', 'đã hoàn']
  },
  {
    keyword: 'dong nhan',
    standardTag: 'Đồng Nhân',
    category: 'type',
    priority: 7,
    aliases: ['đồng nhân', 'dongnhan', 'fanfiction', 'fan work']
  },
  {
    keyword: 'truong thien',
    standardTag: 'Trường Thiên',
    category: 'other',
    priority: 5,
    aliases: ['trường thiên', 'truongthien', 'long novel', 'truyện dài kỳ']
  },

];


// ============== MAIN ==============
async function seedTagDictionary() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing TagDictionary...');
    await TagDictionary.deleteMany({});

    console.log('📝 Inserting seed data...');
    const result = await TagDictionary.insertMany(seedData);

    // Stats
    const categories = [...new Set(seedData.map(s => s.category))];
    console.log(`✅ Seed completed!`);
    console.log(`   - Inserted/Updated: ${result.length} entries`);
    console.log(`   - Total categories: ${categories.length}`);
    console.log(`   - Total standard tags: ${result.length}`);
    
    console.log('\n📊 Statistics by category:');
    for (const cat of categories) {
      const count = seedData.filter(s => s.category === cat).length;
      console.log(`   - ${cat}: ${count} entries`);
    }

  } catch (error) {
    console.error('❌ Error seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedTagDictionary();
