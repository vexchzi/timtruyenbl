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

  // ============== COUPLE TYPE ==============
  {
    keyword: '1v1',
    standardTag: '1v1',
    category: 'relationship',
    priority: 10,
    aliases: ['1x1', '1×1', 'một đôi một', 'chuyên nhất', 'exclusive', 'nhất công nhất thụ']
  },
  {
    keyword: 'np',
    standardTag: 'NP',
    category: 'relationship',
    priority: 8,
    aliases: ['nhiều cp', 'nhiều công', 'nhiều thụ', 'đa phu', 'harem', 'reverse harem']
  },
  {
    keyword: '3p',
    standardTag: '3P',
    category: 'relationship',
    priority: 7,
    aliases: ['threesome', 'ba người']
  },
  {
    keyword: '4p',
    standardTag: '4P',
    category: 'relationship',
    priority: 7,
    aliases: ['foursome', 'bốn người']
  },
  {
    keyword: 'non cp',
    standardTag: 'Non CP',
    category: 'relationship',
    priority: 6,
    aliases: ['noncp', 'không cp', 'no couple', 'không couple']
  },

  // ============== TÍNH CHẤT COUPLE ==============
  {
    keyword: 'cuong cuong',
    standardTag: 'Cường Cường',
    category: 'character',
    priority: 8,
    aliases: ['cường cường', 'cuongcuong', 'cường x cường', 'strong x strong']
  },
  {
    keyword: 'cuong che',
    standardTag: 'Cưỡng Chế',
    category: 'content',
    priority: 7,
    aliases: ['cưỡng chế', 'cuongche', 'forced', 'cưỡng', 'dubcon', 'noncon']
  },
  {
    keyword: 'ho cong',
    standardTag: 'Hỗ Công',
    category: 'content',
    priority: 7,
    aliases: ['hỗ công', 'hocong', 'reversible', 'đổi vai', 'switch']
  },
  {
    keyword: 'ho sung',
    standardTag: 'Hỗ Sủng',
    category: 'genre',
    priority: 8,
    aliases: ['hỗ sủng', 'hosung', 'mutual pampering', 'sủng lẫn nhau']
  },
  {
    keyword: 'nhat kien chung tinh',
    standardTag: 'Nhất Kiến Chung Tình',
    category: 'content',
    priority: 7,
    aliases: ['nhất kiến chung tình', 'love at first sight', 'yêu từ cái nhìn đầu tiên', 'tiếng sét ái tình']
  },
  {
    keyword: 'nien ha',
    standardTag: 'Niên Hạ',
    category: 'relationship',
    priority: 8,
    aliases: ['niên hạ', 'nienha', 'tuổi dưới', 'younger', 'công lớn tuổi hơn']
  },
  {
    keyword: 'nien thuong',
    standardTag: 'Niên Thượng',
    category: 'relationship',
    priority: 8,
    aliases: ['niên thượng', 'mienthuong', 'tuổi trên', 'older', 'thụ lớn tuổi hơn']
  },
  {
    keyword: 'ntr',
    standardTag: 'NTR',
    category: 'content',
    priority: 6,
    aliases: ['ngoại tình', 'netorare', 'cheating', 'cắm sừng']
  },
  {
    keyword: 'song huong tham men',
    standardTag: 'Song Hướng Thầm Mến',
    category: 'content',
    priority: 7,
    aliases: ['song hướng thầm mến', 'song hướng', 'mutual pining', 'cả hai thầm thích', 'song am']
  },
  {
    keyword: 'song khiet',
    standardTag: 'Song Khiết',
    category: 'content',
    priority: 8,
    aliases: ['song khiết', 'songkhiet', 'both virgin', 'cả hai đều trong trắng', 'song xử', 'song trinh']
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
    keyword: 'tinh dich thanh tinh nhan',
    standardTag: 'Tình Địch Thành Tình Nhân',
    category: 'content',
    priority: 7,
    aliases: ['tình địch thành tình nhân', 'enemies to lovers', 'từ tình địch thành người yêu']
  },
  {
    keyword: 'tu cong tu thu',
    standardTag: 'Tự Công Tự Thụ',
    category: 'content',
    priority: 6,
    aliases: ['tự công tự thụ', 'selfcest', 'tự x tự']
  },
  {
    keyword: 'tham men',
    standardTag: 'Thầm Mến',
    category: 'content',
    priority: 7,
    aliases: ['thầm mến', 'thammen', 'secret crush', 'thầm thích', 'crush', 'yêu thầm']
  },
  {
    keyword: 'the than',
    standardTag: 'Thế Thân',
    category: 'content',
    priority: 6,
    aliases: ['thế thân', 'thethan', 'substitute', 'thay thế', 'bạch nguyệt quang']
  },
  {
    keyword: 'thanh mai truc ma',
    standardTag: 'Thanh Mai Trúc Mã',
    category: 'relationship',
    priority: 8,
    aliases: ['thanh mai trúc mã', 'thanhmai', 'trucma', 'childhood sweethearts', 'bạn từ bé', 'quen từ nhỏ', 'trúc mã']
  },
  {
    keyword: 'truong thanh',
    standardTag: 'Trưởng Thành',
    category: 'content',
    priority: 6,
    aliases: ['trưởng thành', 'truongthanh', 'coming of age', 'grow up']
  },
  {
    keyword: 'tuong ai tuong sat',
    standardTag: 'Tương Ái Tương Sát',
    category: 'content',
    priority: 7,
    aliases: ['tương ái tương sát', 'love hate', 'vừa yêu vừa ghét', 'yêu nhau giết nhau']
  },
  {
    keyword: 'doi cong',
    standardTag: 'Đổi Công',
    category: 'content',
    priority: 6,
    aliases: ['đổi công', 'doicong', 'switch top']
  },
  {
    keyword: 'luan loan',
    standardTag: 'Luân Loạn',
    category: 'content',
    priority: 5,
    aliases: ['luân loạn', 'incest', 'côn trùng', 'cấm kỵ']
  },

  // ============== GÓC NHÌN / CHỦ ==============
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

  // ============== THỜI ĐẠI / BỐI CẢNH ==============
  {
    keyword: 'hien dai',
    standardTag: 'Hiện Đại',
    category: 'setting',
    priority: 9,
    aliases: ['hiện đại', 'hiendai', 'modern', 'đương đại']
  },
  {
    keyword: 'co dai',
    standardTag: 'Cổ Đại',
    category: 'setting',
    priority: 9,
    aliases: ['cổ đại', 'codai', 'ancient', 'cổ trang', 'phong kiến', 'co trang']
  },
  {
    keyword: 'dan quoc',
    standardTag: 'Dân Quốc',
    category: 'setting',
    priority: 7,
    aliases: ['dân quốc', 'danquoc', 'republic era', 'thời dân quốc']
  },
  {
    keyword: 'tuong lai',
    standardTag: 'Tương Lai',
    category: 'setting',
    priority: 7,
    aliases: ['tương lai', 'tuonglai', 'future', 'khoa học viễn tưởng', 'sci-fi']
  },
  {
    keyword: 'mat the',
    standardTag: 'Mạt Thế',
    category: 'setting',
    priority: 7,
    aliases: ['mạt thế', 'matthe', 'apocalypse', 'tận thế', 'end of world', 'zombie']
  },
  {
    keyword: 'di gioi',
    standardTag: 'Dị Giới',
    category: 'setting',
    priority: 7,
    aliases: ['dị giới', 'digioi', 'another world', 'isekai', 'thế giới khác']
  },
  {
    keyword: 'nien dai',
    standardTag: 'Niên Đại',
    category: 'setting',
    priority: 6,
    aliases: ['niên đại', 'niendai', 'niên đại 80', 'niên đại 70', 'thập niên']
  },
  {
    keyword: 'phuong tay',
    standardTag: 'Phương Tây',
    category: 'setting',
    priority: 6,
    aliases: ['phương tây', 'phuongtay', 'western', 'âu mỹ']
  },

  // ============== BỐI CẢNH CHI TIẾT ==============
  {
    keyword: 'abo',
    standardTag: 'ABO',
    category: 'setting',
    priority: 9,
    aliases: ['omegaverse', 'alpha beta omega', 'a/b/o']
  },
  {
    keyword: 'cung dinh',
    standardTag: 'Cung Đình',
    category: 'setting',
    priority: 8,
    aliases: ['cung đình', 'cungdinh', 'palace', 'hoàng cung', 'hậu cung', 'triều đình', 'hầu tước']
  },
  {
    keyword: 'hoc duong',
    standardTag: 'Học Đường',
    category: 'setting',
    priority: 8,
    aliases: ['học đường', 'hocduong', 'school', 'campus', 'trường học', 'sinh viên', 'đại học']
  },
  {
    keyword: 'quan nhan',
    standardTag: 'Quân Nhân',
    category: 'setting',
    priority: 8,
    aliases: ['quân nhân', 'quannhan', 'military', 'quân đội', 'lính', 'bộ đội']
  },
  {
    keyword: 'gioi giai tri',
    standardTag: 'Giới Giải Trí',
    category: 'setting',
    priority: 8,
    aliases: ['giới giải trí', 'gioigiaitri', 'showbiz', 'entertainment', 'idol', 'ca sĩ', 'diễn viên', 'ngôi sao']
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
    aliases: ['giang hồ', 'giangho', 'jianghu', 'võ lâm', 'kiếm hiệp']
  },
  {
    keyword: 'do thi',
    standardTag: 'Đô Thị',
    category: 'setting',
    priority: 7,
    aliases: ['đô thị', 'dothi', 'urban', 'thành phố']
  },
  {
    keyword: 'nong thon',
    standardTag: 'Nông Thôn',
    category: 'setting',
    priority: 6,
    aliases: ['nông thôn', 'nongthon', 'rural', 'làng quê', 'điền viên']
  },
  {
    keyword: 'quan truong',
    standardTag: 'Quan Trường',
    category: 'setting',
    priority: 7,
    aliases: ['quan trường', 'quantruong', 'politics', 'chính trị', 'quan chức']
  },
  {
    keyword: 'esport',
    standardTag: 'E-Sport',
    category: 'setting',
    priority: 8,
    aliases: ['esport', 'game', 'gaming', 'pro player', 'thi đấu game', 'điện tử cạnh tranh']
  },
  {
    keyword: 'tu tien',
    standardTag: 'Tu Tiên',
    category: 'setting',
    priority: 8,
    aliases: ['tu tiên', 'tutien', 'cultivation', 'tu chân', 'tiên hiệp', 'tu luyện']
  },
  {
    keyword: 'ky huyen',
    standardTag: 'Kỳ Huyễn',
    category: 'setting',
    priority: 7,
    aliases: ['kỳ huyễn', 'kyhuyen', 'fantasy', 'huyền huyễn', 'huyền ảo', 'ma pháp']
  },
  {
    keyword: 'vong du',
    standardTag: 'Võng Du',
    category: 'setting',
    priority: 7,
    aliases: ['võng du', 'vongdu', 'mmorpg', 'game online', 'virtual reality', 'vr game']
  },

  // ============== TÍNH CHẤT BỐI CẢNH ==============
  {
    keyword: 'he thong',
    standardTag: 'Hệ Thống',
    category: 'content',
    priority: 8,
    aliases: ['hệ thống', 'hethong', 'system', 'kim thủ chỉ']
  },
  {
    keyword: 'xuyen viet',
    standardTag: 'Xuyên Việt',
    category: 'content',
    priority: 9,
    aliases: ['xuyên việt', 'xuyenviet', 'transmigration', 'xuyên', 'xuyên qua']
  },
  {
    keyword: 'xuyen khong',
    standardTag: 'Xuyên Không',
    category: 'content',
    priority: 9,
    aliases: ['xuyên không', 'xuyenkhong', 'time travel', 'xuyên thời gian']
  },
  {
    keyword: 'xuyen sach',
    standardTag: 'Xuyên Sách',
    category: 'content',
    priority: 8,
    aliases: ['xuyên sách', 'xuyensach', 'transmigrate into book', 'xuyên văn', 'xuyên truyện']
  },
  {
    keyword: 'trong sinh',
    standardTag: 'Trọng Sinh',
    category: 'content',
    priority: 9,
    aliases: ['trọng sinh', 'trongsinh', 'rebirth', 'sống lại', 'hồi sinh', 'tái sinh']
  },
  {
    keyword: 'trung sinh',
    standardTag: 'Trùng Sinh',
    category: 'content',
    priority: 8,
    aliases: ['trùng sinh', 'trungsinh', 'reborn', 'đầu thai lại']
  },
  {
    keyword: 'vo han luu',
    standardTag: 'Vô Hạn Lưu',
    category: 'content',
    priority: 7,
    aliases: ['vô hạn lưu', 'vohanluu', 'unlimited flow', 'infinite flow']
  },
  {
    keyword: 'xuyen thanh vai ac',
    standardTag: 'Xuyên Thành Vai Ác',
    category: 'content',
    priority: 8,
    aliases: ['xuyên thành vai ác', 'villain', 'xuyên vai phản diện', 'cannon fodder', 'pháo hôi']
  },
  {
    keyword: 'linh di',
    standardTag: 'Linh Dị',
    category: 'content',
    priority: 7,
    aliases: ['linh dị', 'lingdi', 'supernatural', 'thần quái', 'linh dị thần quái', 'ma quỷ']
  },
  {
    keyword: 'kinh di',
    standardTag: 'Kinh Dị',
    category: 'genre',
    priority: 7,
    aliases: ['kinh dị', 'kinhdi', 'horror', 'sợ hãi', 'rùng rợn']
  },
  {
    keyword: 'suy luan',
    standardTag: 'Suy Luận',
    category: 'genre',
    priority: 7,
    aliases: ['suy luận', 'suyluan', 'mystery', 'trinh thám', 'phá án', 'detective']
  },
  {
    keyword: 'xuyen nhanh',
    standardTag: 'Xuyên Nhanh',
    category: 'content',
    priority: 8,
    aliases: ['xuyên nhanh', 'xuyennhanh', 'quick transmigration', 'fast wear', 'xuyên nhanh nhiều thế giới']
  },

  // ============== THỂ LOẠI / TÍNH CHẤT NỘI DUNG ==============
  {
    keyword: 'nguoc',
    standardTag: 'Ngược',
    category: 'genre',
    priority: 10,
    aliases: ['ngược', 'nguoc', 'nguoc tam', 'ngược tâm', 'angst', 'abuse', 'ngược thân', 'đau thương']
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
    aliases: ['trinh thám', 'trinhtham', 'detective', 'mystery', 'phá án', 'điều tra']
  },
  {
    keyword: 'hac am',
    standardTag: 'Hắc Ám',
    category: 'genre',
    priority: 6,
    aliases: ['hắc ám', 'hacam', 'dark', 'tối tăm', 'u ám', 'dark romance']
  },
  {
    keyword: 'bao thu',
    standardTag: 'Báo Thù',
    category: 'content',
    priority: 7,
    aliases: ['báo thù', 'baothu', 'revenge', 'trả thù', 'phục thù']
  },
  {
    keyword: 'cau huyet',
    standardTag: 'Cẩu Huyết',
    category: 'genre',
    priority: 7,
    aliases: ['cẩu huyết', 'cauhuyet', 'dogblood', 'máu chó', 'drama', 'kịch tính']
  },
  {
    keyword: 'cuu roi',
    standardTag: 'Cứu Rỗi',
    category: 'content',
    priority: 7,
    aliases: ['cứu rỗi', 'cuûroi', 'redemption', 'healing', 'chữa lành']
  },
  {
    keyword: 'cham nhiet',
    standardTag: 'Chậm Nhiệt',
    category: 'content',
    priority: 7,
    aliases: ['chậm nhiệt', 'chamnhiet', 'slow burn', 'từ từ', 'phát triển chậm']
  },
  {
    keyword: 'duong thanh',
    standardTag: 'Dưỡng Thành',
    category: 'content',
    priority: 7,
    aliases: ['dưỡng thành', 'duongthanh', 'raising', 'nuôi dưỡng', 'nuôi lớn']
  },
  {
    keyword: 'guong vo lai lanh',
    standardTag: 'Gương Vỡ Lại Lành',
    category: 'content',
    priority: 7,
    aliases: ['gương vỡ lại lành', 'guongvolailanh', 'reconciliation', 'quay lại', 'tái hợp', 'phá kính trùng viên']
  },
  {
    keyword: 'am ap',
    standardTag: 'Ấm Áp',
    category: 'genre',
    priority: 7,
    aliases: ['ấm áp', 'amap', 'warm', 'healing', 'chữa lành', 'wholesome']
  },
  {
    keyword: 'cuoi truoc yeu sau',
    standardTag: 'Cưới Trước Yêu Sau',
    category: 'content',
    priority: 7,
    aliases: ['cưới trước yêu sau', 'cuoitruocyeusau', 'marriage first', 'hôn trước yêu sau']
  },
  {
    keyword: 'hon nhan ngot ngao',
    standardTag: 'Hôn Nhân Ngọt Ngào',
    category: 'content',
    priority: 7,
    aliases: ['hôn nhân ngọt ngào', 'honnhanngotngao', 'sweet marriage', 'hạnh phúc']
  },
  {
    keyword: 'lam giau',
    standardTag: 'Làm Giàu',
    category: 'content',
    priority: 6,
    aliases: ['làm giàu', 'lamgiau', 'getting rich', 'kinh doanh', 'kiếm tiền']
  },
  {
    keyword: 'gia heo an ho',
    standardTag: 'Giả Heo Ăn Hổ',
    category: 'content',
    priority: 7,
    aliases: ['giả heo ăn hổ', 'giaheoanho', 'hidden strength', 'ẩn thực lực', 'giấu nghề']
  },
  {
    keyword: 'va mat',
    standardTag: 'Vả Mặt',
    category: 'content',
    priority: 7,
    aliases: ['vả mặt', 'vamat', 'face slapping', 'tát mặt', 'sảng văn']
  },
  {
    keyword: 'sang van',
    standardTag: 'Sảng Văn',
    category: 'genre',
    priority: 7,
    aliases: ['sảng văn', 'sangvan', 'satisfying', 'bàn tay vàng', 'sướng']
  },
  {
    keyword: 'oan gia',
    standardTag: 'Oan Gia',
    category: 'content',
    priority: 7,
    aliases: ['oan gia', 'oanga', 'fated enemies', 'nghiệt duyên']
  },

  // ============== 18+ / SMUT ==============
  {
    keyword: 'smut',
    standardTag: 'Smut',
    category: 'content',
    priority: 8,
    aliases: ['h văn', 'hvan', 'h', 'cao h', 'caoh', 'nc17', 'nc-17', 'nc18', 'nc-18', 'r18', 'r-18', 
              'adult', 'explicit', 'lemon', 'lime', 'mature', '18+', 'nsfw', 'nội dung người lớn']
  },
  {
    keyword: 'thanh thuy van',
    standardTag: 'Thanh Thủy Văn',
    category: 'content',
    priority: 6,
    aliases: ['thanh thủy văn', 'thanhthuyvan', 'no smut', 'không có h', 'clean']
  },

  // ============== TÍNH CHẤT CÔNG ==============
  {
    keyword: 'cuong cong',
    standardTag: 'Cường Công',
    category: 'character',
    priority: 8,
    aliases: ['cường công', 'cuongcong', 'strong gong', 'công mạnh mẽ']
  },
  {
    keyword: 'ba dao tong tai',
    standardTag: 'Bá Đạo Tổng Tài',
    category: 'character',
    priority: 8,
    aliases: ['bá đạo tổng tài', 'badaotongtai', 'ceo', 'tổng tài', 'boss', 'dominant ceo']
  },
  {
    keyword: 'phuc hac',
    standardTag: 'Phúc Hắc',
    category: 'character',
    priority: 7,
    aliases: ['phúc hắc', 'phuchac', 'black belly', 'bụng đen', 'độc ác']
  },
  {
    keyword: 'tra cong',
    standardTag: 'Tra Công',
    category: 'character',
    priority: 7,
    aliases: ['tra công', 'tracong', 'scum gong', 'công tra', 'công tệ bạc']
  },
  {
    keyword: 'my cong',
    standardTag: 'Mỹ Công',
    category: 'character',
    priority: 7,
    aliases: ['mỹ công', 'mycong', 'beautiful gong', 'công đẹp trai']
  },
  {
    keyword: 'lang tu',
    standardTag: 'Lãng Tử',
    category: 'character',
    priority: 6,
    aliases: ['lãng tử', 'langtu', 'playboy', 'đào hoa', 'công phong lưu']
  },

  // ============== TÍNH CHẤT THỤ ==============
  {
    keyword: 'cuong thu',
    standardTag: 'Cường Thụ',
    category: 'character',
    priority: 8,
    aliases: ['cường thụ', 'cuongthu', 'strong shou', 'thụ mạnh mẽ']
  },
  {
    keyword: 'my thu',
    standardTag: 'Mỹ Thụ',
    category: 'character',
    priority: 7,
    aliases: ['mỹ thụ', 'mythu', 'beautiful shou', 'thụ xinh đẹp']
  },
  {
    keyword: 'yeu thu',
    standardTag: 'Yếu Thụ',
    category: 'character',
    priority: 6,
    aliases: ['yếu thụ', 'yeuthu', 'weak shou', 'thụ yếu đuối']
  },
  {
    keyword: 'tra thu',
    standardTag: 'Tra Thụ',
    category: 'character',
    priority: 7,
    aliases: ['tra thụ', 'trathu', 'scum shou', 'thụ tra', 'thụ tệ bạc']
  },
  {
    keyword: 'pháo hoi',
    standardTag: 'Pháo Hôi',
    category: 'character',
    priority: 7,
    aliases: ['pháo hôi', 'phaohoi', 'cannon fodder', 'vai phụ', 'nhân vật bị hy sinh']
  },
  {
    keyword: 'thu truy cong',
    standardTag: 'Thụ Truy Công',
    category: 'content',
    priority: 7,
    aliases: ['thụ truy công', 'thutruycong', 'shou chases gong', 'thụ đuổi theo công']
  },
  {
    keyword: 'sinh con',
    standardTag: 'Sinh Con',
    category: 'content',
    priority: 6,
    aliases: ['sinh con', 'sinhcon', 'mpreg', 'nam mang thai', 'có em bé']
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

  // ============== ĐAM MỸ / BL ==============
  {
    keyword: 'dam my',
    standardTag: 'Đam Mỹ',
    category: 'relationship',
    priority: 10,
    aliases: ['đam mỹ', 'dammy', 'bl', 'boys love', 'yaoi', 'danmei', 'đan mỹ', 'nam nam', 'gay', 
              'boylove', 'boy x boy', 'boyxboy', "boy's love", 'boys love', "boys' love"]
  },
  {
    keyword: 'bach hop',
    standardTag: 'Bách Hợp',
    category: 'relationship',
    priority: 8,
    aliases: ['bách hợp', 'bachhop', 'gl', 'girls love', 'yuri', 'lesbian', 'nữ nữ']
  },

  // ============== KHÁC ==============
  {
    keyword: 'di nang',
    standardTag: 'Dị Năng',
    category: 'content',
    priority: 7,
    aliases: ['dị năng', 'dinang', 'superpower', 'siêu năng lực', 'năng lực đặc biệt']
  },
  {
    keyword: 'chuyen doi linh hon',
    standardTag: 'Hoán Đổi Linh Hồn',
    category: 'content',
    priority: 6,
    aliases: ['hoán đổi linh hồn', 'chuyển đổi linh hồn', 'body swap', 'đổi thân']
  },
  {
    keyword: 'nguoc luyen tinh tham',
    standardTag: 'Ngược Luyến Tình Thâm',
    category: 'genre',
    priority: 7,
    aliases: ['ngược luyến tình thâm', 'nguocluyentinhtham', 'bitter love', 'tình yêu cay đắng']
  },
  {
    keyword: 'tinh dau y hop',
    standardTag: 'Tình Đầu Ý Hợp',
    category: 'content',
    priority: 6,
    aliases: ['tình đầu ý hợp', 'tinhdauyyhop', 'mutual first love', 'đầu tiên của nhau']
  },
  {
    keyword: 'nhan duyen',
    standardTag: 'Nhân Duyên',
    category: 'content',
    priority: 5,
    aliases: ['nhân duyên', 'nhanduyen', 'fate', 'nhân duyên gặp gỡ', 'duyên phận']
  },
  {
    keyword: 'dong nhan',
    standardTag: 'Đồng Nhân',
    category: 'other',
    priority: 6,
    aliases: ['đồng nhân', 'dongnhan', 'fanfic', 'fanfiction', 'fan fiction']
  },
  {
    keyword: 'nguyen sang',
    standardTag: 'Nguyên Sáng',
    category: 'other',
    priority: 6,
    aliases: ['nguyên sáng', 'nguyensang', 'original', 'sáng tác gốc', 'original work']
  },
  {
    keyword: 'hoan thanh',
    standardTag: 'Hoàn Thành',
    category: 'other',
    priority: 8,
    aliases: ['hoàn thành', 'hoanthanh', 'completed', 'hoàn', 'full', 'đã hoàn']
  },
  {
    keyword: 'doan van',
    standardTag: 'Đoản Văn',
    category: 'other',
    priority: 6,
    aliases: ['đoản văn', 'doanvan', 'short story', 'oneshot', 'one shot', 'truyện ngắn', 'ngắn']
  },
  {
    keyword: 'truong thien',
    standardTag: 'Trường Thiên',
    category: 'other',
    priority: 6,
    aliases: ['trường thiên', 'truongthien', 'long story', 'truyện dài', 'dài']
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

