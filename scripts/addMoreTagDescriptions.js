/**
 * Thêm mô tả cho các tags còn thiếu
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

const MORE_TAG_DESCRIPTIONS = {
  // ========== CHARACTER ==========
  'Bá Đạo Tổng Tài': 'Tổng tài có tính cách bá đạo, độc đoán',
  'Băng Sơn': 'Nhân vật lạnh lùng như băng sơn, khó tiếp cận',
  'Bệnh Kiều': 'Nhân vật có tâm lý bất thường, ám ảnh, si tình bệnh hoạn',
  'Cường Công': 'Công mạnh mẽ về năng lực hoặc tính cách',
  'Lãng Tử': 'Nhân vật phong lưu, tự do, không bị ràng buộc',
  'Pháo Hôi': 'Nhân vật ban đầu bị ghét bỏ, sau được yêu thương',
  'Phúc Hắc': 'Nhân vật bề ngoài hiền lành nhưng bên trong thâm sâu',
  'Tra Cường Công': 'Công vừa tệ bạc vừa mạnh mẽ',
  'Tra Thụ': 'Thụ là người tệ bạc, xấu xa hoặc bạc tình',
  'Yandere': 'Nhân vật si tình bệnh hoạn, yêu đến mức điên cuồng',
  'Yếu Thụ': 'Thụ yếu đuối về thể chất hoặc tính cách',
  
  // ========== CONTENT ==========
  'App': 'Truyện có yếu tố ứng dụng điện thoại, app hẹn hò',
  'Chạy Nạn': 'Nhân vật phải chạy trốn, lánh nạn',
  'Chậm Nhiệt': 'Tình cảm phát triển chậm rãi, dần dần',
  'Chế Tác': 'Nhân vật làm nghề chế tác, làm đồ thủ công',
  'Chết Đi Sống Lại': 'Nhân vật trải qua cái chết rồi hồi sinh',
  'Cưới Trước Yêu Sau': 'Kết hôn trước rồi mới nảy sinh tình cảm',
  'Cưỡng Chế': 'Có yếu tố ép buộc trong mối quan hệ',
  'Cưỡng Ép': 'Có yếu tố cưỡng ép, không tự nguyện',
  'Cổ Xuyên Kim': 'Xuyên từ thời cổ đại đến hiện đại',
  'Cứu Chuộc': 'Nhân vật cứu chuộc tội lỗi của mình',
  'Dưỡng Oa': 'Nuôi dưỡng em bé, có yếu tố gia đình',
  'Dưỡng Thành': 'Nuôi dưỡng nhân vật từ nhỏ đến lớn rồi yêu',
  'Dị Năng': 'Nhân vật có năng lực siêu nhiên đặc biệt',
  'Giám Bảo': 'Liên quan đến việc thẩm định cổ vật, đá quý',
  'Giả Heo Ăn Hổ': 'Nhân vật giả vờ yếu đuối nhưng thực chất rất mạnh',
  'Giải Mật': 'Truyện có yếu tố giải mã bí ẩn',
  'Group Chat': 'Truyện xoay quanh nhóm chat, trò chuyện online',
  'Hoán Đổi Linh Hồn': 'Linh hồn hai người hoán đổi cho nhau',
  'Hôn Nhân Ngọt Ngào': 'Truyện về cuộc sống hôn nhân hạnh phúc',
  'Hợp Thành': 'Nhiều người hợp lại thành một thể',
  'Khoa Cử': 'Bối cảnh thi cử thời phong kiến',
  'Kịch Thấu': 'Truyện có nhiều drama, kịch tính',
  'Linh Khí Sống Lại': 'Linh khí trên thế giới hồi phục',
  'Linh Tuyền': 'Có suối linh, nguồn nước thần kỳ',
  'Luyện Tông': 'Phái luyện đan, chế tạo thuốc',
  'Lưu Đày': 'Nhân vật bị lưu đày, trục xuất',
  'Lữ Hành': 'Truyện về cuộc hành trình, du lịch',
  'Mạo Hiểm': 'Truyện phiêu lưu mạo hiểm',
  'Mỹ Thực': 'Truyện về ẩm thực, nấu ăn',
  'NTR': 'Netorare - Bị cướp người yêu, ngoại tình',
  'Nghe Hiểu Thực Vật': 'Có khả năng giao tiếp với thực vật',
  'Nghe Hiểu Động Vật': 'Có khả năng giao tiếp với động vật',
  'Nghiên Cứu Khoa Học': 'Nhân vật làm nghiên cứu khoa học',
  'Ngôn Linh': 'Có khả năng điều khiển bằng lời nói',
  'Nhiều Hệ Thống': 'Có nhiều hệ thống cùng tồn tại',
  'Nhân Duyên': 'Truyện về duyên phận định mệnh',
  'Nhất Kiến Chung Tình': 'Yêu ngay từ cái nhìn đầu tiên',
  'Nộp Bàn Tay Vàng': 'Tự nộp thân cho đối phương',
  'Oan Gia': 'Hai người là oan gia, kẻ thù',
  'Phong Thủy': 'Truyện có yếu tố phong thủy, xem vận',
  'Phát Sóng Trực Tiếp': 'Nhân vật làm streamer, livestream',
  'Qua Lại Thời Không': 'Có thể đi lại giữa các thời đại',
  'Quy Tắc Quái Đàm': 'Truyện về các quy tắc kỳ quái, bí ẩn',
  'Rút Thăm Trúng Thưởng': 'Có yếu tố may mắn, bốc thăm',
  'Sinh Con': 'Nhân vật nam có thể sinh con',
  'Song Hướng Thầm Mến': 'Cả hai đều thầm thích nhau',
  'Song Hệ Thống': 'Hai người đều có hệ thống',
  'Song Trọng Sinh': 'Cả hai đều được trọng sinh',
  'Song Xuyên': 'Cả hai đều xuyên không',
  'Tam Quan Bất Chính': 'Quan điểm đạo đức không theo chuẩn mực',
  'Thai Xuyên': 'Xuyên không khi còn trong bào thai',
  'Thanh Thủy Văn': 'Truyện không có cảnh nóng',
  'Thiên Tai': 'Bối cảnh thảm họa thiên nhiên',
  'Thân Xuyên': 'Linh hồn xuyên vào thân xác người khác',
  'Thôi Miên': 'Có yếu tố thôi miên, điều khiển tâm trí',
  'Thấu Thị': 'Có khả năng nhìn xuyên thấu',
  'Thầm Mến': 'Yêu thầm, giấu kín tình cảm',
  'Thế Thân': 'Nhân vật làm người thế thân cho ai đó',
  'Thụ Truy Công': 'Thụ chủ động theo đuổi công',
  'Tiên Tri': 'Có khả năng nhìn thấy tương lai',
  'Tiến Hóa': 'Nhân vật tiến hóa, nâng cấp bản thân',
  'Tool Mô Phỏng': 'Có công cụ mô phỏng, dự đoán',
  'Truy Thê': 'Công theo đuổi thụ (gọi thụ là vợ)',
  'Trùng Sinh': 'Được sinh lại từ đầu',
  'Trưởng Thành': 'Nhân vật trưởng thành qua thời gian',
  'Trộm Mộ': 'Truyện về đạo mộ, khảo cổ',
  'Tình Đầu Ý Hợp': 'Hai người hợp ý nhau ngay từ đầu',
  'Tình Địch Thành Tình Nhân': 'Từ tình địch trở thành người yêu',
  'Tùy Thân Gia Gia': 'Có ông tiên/tiền bối đi theo',
  'Tùy Thân Không Gian': 'Có không gian riêng mang theo người',
  'Tương Ái Tương Sát': 'Vừa yêu vừa hận, yêu đến muốn giết',
  'Tự Công Tự Thụ': 'Tự phân vai công thụ cho chính mình',
  'Viết Văn': 'Nhân vật là tác giả, viết truyện',
  'Vô Bàn Tay Vàng': 'Không có bàn tay vàng, vận may kém',
  'Vô Hạn Lưu': 'Phải vượt qua vô hạn thử thách',
  'Vô Hệ Thống': 'Không có hệ thống hỗ trợ',
  'Võng Hồng': 'Nhân vật là người nổi tiếng trên mạng',
  'Võng Phối': 'Hẹn hò qua mạng',
  'Vả Mặt': 'Truyện có nhiều tình tiết phản đòn, vả mặt',
  'Vị Diện': 'Giữ thể diện, danh dự',
  'Xuyên Chậm': 'Xuyên không nhưng tiến độ chậm',
  'Xuyên Nhanh': 'Xuyên qua nhiều thế giới nhanh chóng',
  'Xuyên Thành Vai Ác': 'Xuyên thành nhân vật phản diện',
  'Y Thuật': 'Nhân vật có tài y thuật, chữa bệnh',
  'Đan Xuyên': 'Xuyên lại nhiều lần',
  'Đua Xe': 'Truyện về đua xe, tốc độ',
  'Đọc Tâm': 'Có khả năng đọc suy nghĩ người khác',
  'Đổ Thạch': 'Truyện về đánh bạc đá quý, đổ thạch',
  'Đổi Công': 'Đổi vai trò từ thụ sang công',
  
  // ========== GENRE ==========
  'Chính Kịch': 'Truyện nghiêm túc, kịch tính cao',
  'Hắc Ám': 'Truyện có yếu tố đen tối, u ám',
  'Hỗ Sủng': 'Cả hai cùng chiều chuộng lẫn nhau',
  'Kinh Dị': 'Truyện kinh dị, rùng rợn',
  'Suy Luận': 'Truyện suy luận, phá án',
  'Sảng Văn': 'Truyện sảng khoái, nhẹ nhàng thoải mái',
  'Trinh Thám': 'Truyện điều tra, phá án',
  'Điềm Văn': 'Truyện nhẹ nhàng, bình yên',
  'Ấm Áp': 'Truyện ấm áp, chữa lành tâm hồn',
  
  // ========== OTHER ==========
  'Thị Giác Nữ Chủ': 'Truyện có góc nhìn của nữ chính',
  'Đa Thị Giác': 'Truyện có nhiều góc nhìn khác nhau',
  
  // ========== RELATIONSHIP ==========
  '3P': 'Mối quan hệ ba người',
  '4P': 'Mối quan hệ bốn người',
  'Bách Hợp': 'Truyện tình cảm nữ x nữ',
  'Non CP': 'Truyện không có cặp đôi chính',
  'Tình Địch Biến CP': 'Tình địch trở thành couple',
  
  // ========== SETTING ==========
  'Cao Võ': 'Thế giới võ thuật phát triển cao',
  'Chức Trường': 'Bối cảnh nơi làm việc, công sở',
  'Cthulhu': 'Bối cảnh Cthulhu, kinh dị vũ trụ',
  'Cyberpunk': 'Bối cảnh tương lai công nghệ cao, xã hội suy đồi',
  'Cơ Giáp': 'Bối cảnh robot, mech khổng lồ',
  'Cổ Võ': 'Võ thuật thời cổ đại',
  'Dị Giới': 'Bối cảnh thế giới khác',
  'Dị Thế': 'Bối cảnh thế giới khác biệt',
  'E-Sport': 'Bối cảnh thể thao điện tử, game',
  'Giả Tưởng Lịch Sử': 'Lịch sử giả tưởng, khác với thực tế',
  'Giới Thời Trang': 'Bối cảnh ngành thời trang',
  'Huyết Tộc': 'Bối cảnh ma cà rồng, hút máu',
  'Hào Môn': 'Bối cảnh gia đình giàu có quyền thế',
  'Hải Đảo': 'Bối cảnh đảo, biển',
  'Học Viện Quý Tộc': 'Bối cảnh trường học dành cho giới thượng lưu',
  'Hồng Hoang': 'Bối cảnh thời hồng hoang, sơ khai',
  'Kỳ Huyễn': 'Bối cảnh kỳ ảo, fantasy',
  'Linh Dị Thần Quái': 'Bối cảnh có linh hồn, quái vật',
  'Long Tộc': 'Bối cảnh tộc rồng',
  'Ma Pháp': 'Bối cảnh có ma thuật, phép thuật',
  'Nam Nam Thế Giới': 'Thế giới chỉ có đàn ông',
  'Nguyên Thủy': 'Bối cảnh thời nguyên thủy, sơ khai',
  'Niên Đại': 'Bối cảnh một thời đại cụ thể trong lịch sử',
  'Phương Tây': 'Bối cảnh phương Tây',
  'Phế Thổ': 'Bối cảnh hoang tàn, đổ nát',
  'Quan Trường': 'Bối cảnh quan trường, chính trị',
  'Steampunk': 'Bối cảnh công nghệ hơi nước',
  'Tam Giáo Cửu Lưu': 'Bối cảnh xã hội đa dạng, phức tạp',
  'Thú Nhân': 'Bối cảnh có người thú, nhân thú',
  'Thần Thoại': 'Bối cảnh thần thoại, thần linh',
  'Thần Tiên Yêu Quái': 'Bối cảnh có tiên, yêu quái',
  'Thế Giới Song Song': 'Bối cảnh thế giới song song',
  'Thể Thao': 'Bối cảnh thể thao',
  'Thời Chiến Quốc': 'Bối cảnh thời Chiến Quốc',
  'Thời Trung Cổ': 'Bối cảnh thời trung cổ châu Âu',
  'Thời Xuân Thu': 'Bối cảnh thời Xuân Thu',
  'Tinh Tế': 'Bối cảnh tinh tế, vũ trụ',
  'Truyện Cổ Tích': 'Bối cảnh truyện cổ tích',
  'Tu Chân': 'Bối cảnh tu luyện chân pháp',
  'Tây Huyễn': 'Bối cảnh fantasy phương Tây',
  'Tương Lai': 'Bối cảnh tương lai',
  'Tổng Nghệ': 'Bối cảnh chương trình tổng hợp, variety show',
  'Võng Du': 'Bối cảnh game online',
  'Vũ Cổ': 'Bối cảnh vũ trụ thời cổ',
  'Đô Thị': 'Bối cảnh đô thị, thành phố',
  'Đô Thị Tình Duyên': 'Chuyện tình đô thị hiện đại',
  'Đại Hán': 'Bối cảnh triều Hán',
  'Đại Minh': 'Bối cảnh triều Minh',
  'Đại Thanh': 'Bối cảnh triều Thanh',
  'Đại Tần': 'Bối cảnh triều Tần',
  'Đại Tống': 'Bối cảnh triều Tống',
  'Đại Đường': 'Bối cảnh triều Đường',
  'Đấu Khí': 'Bối cảnh tu luyện đấu khí',
  
  // Additional missing ones
  'Huyền Huyễn': 'Truyện có yếu tố huyền bí, ma thuật, kỳ ảo',
  'Võ Hiệp': 'Bối cảnh giang hồ, kiếm khách, võ công',
  'Khoái Xuyên': 'Xuyên nhanh qua nhiều thế giới nhỏ',
  'Mang Thai': 'Nhân vật nam có thể mang thai',
  'Đông Phương': 'Bối cảnh phương Đông (Trung Quốc, Việt Nam...)',
  'Tây Phương': 'Bối cảnh phương Tây (Châu Âu, Mỹ...)',
  'Hàn Quốc': 'Bối cảnh Hàn Quốc',
  'Nhật Bản': 'Bối cảnh Nhật Bản',
  'Thái Lan': 'Bối cảnh Thái Lan',
  'Hoan Hỉ Oan Gia': 'Hai người ghét nhau rồi yêu nhau',
  'Trục Thê': 'Thụ đuổi theo công',
  'Cường Thủ Hào Đoạt': 'Dùng sức mạnh để cưỡng ép, chiếm đoạt',
  'Giam Cầm': 'Một bên bị giam giữ bởi bên kia',
  'Thân Trước Tình Sau': 'Có quan hệ thể xác trước rồi mới yêu',
  'Mất Trí Nhớ': 'Nhân vật bị mất trí nhớ',
  'Sống Lại': 'Nhân vật chết rồi sống lại',
  'Hắc Hóa': 'Nhân vật từ tốt chuyển sang xấu, đen tối',
  'Bạch Hóa': 'Nhân vật từ xấu chuyển sang tốt',
  'Đơn Phương': 'Yêu đơn phương',
  'Giấu Giếm': 'Giấu giếm thân phận hoặc tình cảm',
  'Hiểu Lầm': 'Có nhiều hiểu lầm giữa hai người',
  'Vạn Nhân Mê': 'Nhân vật được rất nhiều người yêu thích',
  'Thiên Chi Kiêu Tử': 'Nhân vật được trời ban cho, tài năng xuất chúng',
  'Cường Cường': 'Cả công và thụ đều mạnh mẽ',
  'Niên Thượng': 'Công lớn tuổi hơn thụ',
  'Niên Hạ': 'Công nhỏ tuổi hơn thụ',
  'Phi Song Khiết': 'Một hoặc cả hai đã có kinh nghiệm với người khác',
  'Ngược Tâm': 'Ngược về mặt tinh thần, đau khổ tâm lý',
  'Ngược Thân': 'Ngược về mặt thể xác',
  'Tiểu Bạch Thụ': 'Thụ ngây ngô, thiếu kinh nghiệm',
  'Trung Khuyển Công': 'Công trung thành tuyệt đối như chó',
  'Cao Lãnh Công': 'Công kiêu ngạo, ở vị trí cao',
  'Cảnh Sát': 'Nhân vật làm công an, cảnh sát',
  'Học Sinh': 'Nhân vật đang đi học',
  'Giáo Viên': 'Nhân vật làm nghề dạy học',
  'Quân Văn': 'Bối cảnh quân đội, quân nhân',
  'Chức Nghiệp': 'Tập trung vào công việc, nghề nghiệp',
  'HE': 'Happy Ending - Kết thúc có hậu',
  'BE': 'Bad Ending - Kết thúc bi kịch',
  'OE': 'Open Ending - Kết thúc mở'
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let updated = 0;

  for (const [standardTag, description] of Object.entries(MORE_TAG_DESCRIPTIONS)) {
    const result = await TagDictionary.updateMany(
      { 
        standardTag,
        $or: [
          { description: null },
          { description: '' },
          { description: { $exists: false } }
        ]
      },
      { $set: { description } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ ${standardTag}: ${result.modifiedCount} updated`);
      updated += result.modifiedCount;
    }
  }

  // Check remaining without description
  const remaining = await TagDictionary.countDocuments({
    $or: [
      { description: null },
      { description: '' },
      { description: { $exists: false } }
    ]
  });

  console.log(`\n📊 Summary:`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Still missing: ${remaining}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
