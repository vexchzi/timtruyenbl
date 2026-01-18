/**
 * Thêm mô tả cho tất cả các tags trong TagDictionary
 */
require('dotenv').config();
const mongoose = require('mongoose');
const TagDictionary = require('../models/TagDictionary');

// Mô tả cho các tags theo standardTag
const TAG_DESCRIPTIONS = {
  // ========== ENDING ==========
  'HE': 'Happy Ending - Kết thúc có hậu, đôi chính được ở bên nhau',
  'BE': 'Bad Ending - Kết thúc bi kịch, thường là chia ly hoặc chết',
  'OE': 'Open Ending - Kết thúc mở, để người đọc tự suy nghĩ',
  'Hoàn Thành': 'Truyện đã được viết xong, không còn cập nhật',
  
  // ========== RELATIONSHIP ==========
  '1v1': 'Một công một thụ, không có nhân vật thứ ba xen vào',
  'NP': 'Nhiều người - Có nhiều hơn 2 người trong mối quan hệ',
  'Đam Mỹ': 'Truyện tình cảm nam x nam (Boys Love)',
  'Chủ Thụ': 'Truyện tập trung vào góc nhìn của nhân vật thụ',
  'Chủ Công': 'Truyện tập trung vào góc nhìn của nhân vật công',
  'Hỗ Công': 'Hai nhân vật có thể hoán đổi vai trò công/thụ',
  'Cường Cường': 'Cả công và thụ đều mạnh mẽ, ngang tài ngang sức',
  'Niên Thượng': 'Công lớn tuổi hơn thụ',
  'Niên Hạ': 'Công nhỏ tuổi hơn thụ',
  
  // ========== CHARACTER - CÔNG ==========
  'Phúc Hắc Công': 'Công có tính cách thâm sâu, hay tính toán, bề ngoài ôn hòa nhưng bên trong đen tối',
  'Bá Đạo Công': 'Công có tính cách mạnh mẽ, quyết đoán, thích kiểm soát',
  'Ôn Nhu Công': 'Công dịu dàng, ân cần, biết chiều chuộng thụ',
  'Trung Khuyển Công': 'Công trung thành tuyệt đối, si tình như chó với chủ',
  'Lãnh Đạm Công': 'Công có vẻ ngoài lạnh lùng, ít biểu cảm',
  'Cao Lãnh Công': 'Công kiêu ngạo, ở vị trí cao, khó tiếp cận',
  'Tra Công': 'Công là người tệ bạc, phản bội hoặc bạc tình',
  'Phong Lưu Công': 'Công từng có nhiều người tình, kinh nghiệm phong phú',
  'Bình Phàm Công': 'Công là người bình thường, không có gì đặc biệt',
  'Thú Khống Công': 'Công có đặc điểm hoặc khả năng liên quan đến động vật',
  
  // ========== CHARACTER - THỤ ==========
  'Cường Thụ': 'Thụ mạnh mẽ về tính cách hoặc năng lực',
  'Nhược Thụ': 'Thụ yếu đuối, cần được bảo vệ',
  'Mỹ Thụ': 'Thụ có ngoại hình xinh đẹp, quyến rũ',
  'Cao Lãnh Thụ': 'Thụ kiêu ngạo, khó tiếp cận, ở vị trí cao',
  'Lãnh Đạm Thụ': 'Thụ có vẻ ngoài lạnh lùng, ít biểu cảm',
  'Ngây Thơ Thụ': 'Thụ ngây ngô, trong sáng, chưa hiểu chuyện yêu đương',
  'Tiểu Bạch Thụ': 'Thụ ngây ngô, thiếu kinh nghiệm sống',
  'Đại Thúc Thụ': 'Thụ lớn tuổi, chín chắn, trưởng thành',
  'Bình Phàm Thụ': 'Thụ là người bình thường, không có gì đặc biệt',
  'Thụ Đa Công': 'Một thụ có nhiều công theo đuổi',
  
  // ========== CHARACTER - OTHER ==========
  'Tổng Tài': 'Nhân vật là giám đốc, chủ tịch công ty giàu có',
  'Minh Tinh': 'Nhân vật là ngôi sao giải trí, ca sĩ, diễn viên',
  'Bác Sĩ': 'Nhân vật làm nghề y, bác sĩ',
  'Quân Nhân': 'Nhân vật là lính, quân đội',
  'Cảnh Sát': 'Nhân vật làm công an, cảnh sát',
  'Học Sinh': 'Nhân vật đang đi học',
  'Giáo Viên': 'Nhân vật làm nghề dạy học',
  'Thông Minh': 'Nhân vật có trí tuệ cao, thông minh',
  'Quỷ Tính': 'Nhân vật có tính cách quỷ quyệt, xảo trá',
  
  // ========== CONTENT ==========
  'Ngọt': 'Truyện ngọt ngào, ít drama, tình cảm ấm áp',
  'Ngọt Ngào': 'Truyện rất ngọt, nhiều tình tiết lãng mạn dễ thương',
  'Sủng': 'Nhân vật được chiều chuộng, yêu thương hết mực',
  'Công Sủng Thụ': 'Công chiều chuộng, yêu thương thụ hết mực',
  'Thụ Sủng Công': 'Thụ chiều chuộng, yêu thương công hết mực',
  'Ngược': 'Truyện có nhiều tình tiết đau khổ, chia ly, hiểu lầm',
  'Ngược Tâm': 'Ngược về mặt tinh thần, đau khổ tâm lý',
  'Ngược Thân': 'Ngược về mặt thể xác, bị thương, bị hành hạ',
  'Chút Ngược': 'Có một chút ngược nhẹ, không quá nặng nề',
  'Cẩu Huyết': 'Truyện có nhiều tình tiết drama, bi kịch, máu chó',
  'Hài': 'Truyện hài hước, nhiều tình tiết vui nhộn',
  'Smut': 'Truyện có cảnh nóng chi tiết, 18+',
  'Thanh Thủy': 'Truyện không có cảnh nóng hoặc rất ít',
  'Song Khiết': 'Cả công và thụ đều trong trắng, chưa từng có ai',
  'Phi Song Khiết': 'Một hoặc cả hai đã có kinh nghiệm với người khác',
  'Sinh Tử': 'Truyện có tình tiết sinh tử, sống chết, hy sinh',
  'Trường Thiên': 'Truyện dài, nhiều chương',
  'Đoản Văn': 'Truyện ngắn, ít chương',
  'Tình Cảm': 'Truyện tập trung vào diễn biến tình cảm',
  'Báo Thù': 'Nhân vật trả thù những kẻ đã hại mình',
  'Làm Giàu': 'Nhân vật phấn đấu làm giàu, kinh doanh thành công',
  
  // ========== GENRE ==========
  'Hiện Đại': 'Bối cảnh thời hiện đại, đương đại',
  'Cổ Đại': 'Bối cảnh cổ trang, thời phong kiến',
  'Xuyên Không': 'Nhân vật xuyên qua thời gian hoặc không gian khác',
  'Xuyên Việt': 'Nhân vật xuyên qua các thời đại, quốc gia',
  'Trọng Sinh': 'Nhân vật chết đi sống lại, quay về quá khứ',
  'Xuyên Sách': 'Nhân vật xuyên vào trong truyện/tiểu thuyết',
  'Hệ Thống': 'Truyện có yếu tố game, hệ thống nhiệm vụ, nâng cấp',
  'Tu Tiên': 'Bối cảnh tu luyện thành tiên, võ hiệp tiên hiệp',
  'Huyền Huyễn': 'Truyện có yếu tố huyền bí, ma thuật, kỳ ảo',
  'Võ Hiệp': 'Bối cảnh giang hồ, kiếm khách, võ công',
  'Mạt Thế': 'Bối cảnh tận thế, zombie, thảm họa',
  'ABO': 'Thế giới Alpha/Beta/Omega với cơ chế sinh sản đặc biệt',
  'Linh Dị': 'Truyện có yếu tố tâm linh, ma quỷ',
  'Khoái Xuyên': 'Xuyên nhanh qua nhiều thế giới nhỏ',
  'Điền Văn': 'Truyện về cuộc sống điền viên, làm nông, yên bình',
  'Hài': 'Truyện hài hước, vui nhộn',
  'Lịch Sử': 'Bối cảnh lịch sử thực, có yếu tố lịch sử',
  
  // ========== SETTING ==========
  'Giới Giải Trí': 'Bối cảnh showbiz, làng giải trí',
  'Học Đường': 'Bối cảnh trường học, đại học',
  'Cung Đình': 'Bối cảnh cung điện, hoàng cung',
  'Giang Hồ': 'Bối cảnh giang hồ, bang hội, môn phái',
  'Hắc Bang': 'Bối cảnh xã hội đen, mafia, tội phạm',
  'Quân Văn': 'Bối cảnh quân đội, quân nhân',
  'Hào Môn Thế Gia': 'Bối cảnh gia đình quyền quý, danh gia vọng tộc',
  'Chức Nghiệp': 'Tập trung vào công việc, nghề nghiệp của nhân vật',
  'Nông Thôn': 'Bối cảnh nông thôn, làng quê',
  
  // ========== SPECIAL RELATIONSHIPS ==========
  'Thanh Mai Trúc Mã': 'Hai người quen nhau từ nhỏ, lớn lên yêu nhau',
  'Tình Địch Hóa Tình Nhân': 'Từ kẻ thù trở thành người yêu',
  'Sư Đồ': 'Quan hệ thầy trò yêu nhau',
  'Phụ Tử': 'Quan hệ cha con (không huyết thống) yêu nhau',
  'Huynh Đệ': 'Quan hệ anh em (có thể không huyết thống) yêu nhau',
  'Chú Cháu': 'Quan hệ chú cháu yêu nhau',
  'Song Sinh': 'Quan hệ anh em sinh đôi yêu nhau',
  'Nghĩa Phụ': 'Quan hệ cha nuôi - con nuôi yêu nhau',
  'Quân Thần': 'Quan hệ vua - bề tôi yêu nhau',
  'Chủ Tớ': 'Quan hệ chủ nhân - người hầu yêu nhau',
  'Incest': 'Truyện có yếu tố loạn luân (có quan hệ huyết thống)',
  
  // ========== OTHER ==========
  'Mang Thai': 'Nhân vật nam có thể mang thai',
  'Nữ Biến Nam': 'Nhân vật nữ biến thành nam hoặc giả trai',
  'Song Tính': 'Nhân vật có cả bộ phận nam và nữ',
  'Giả Nữ': 'Nhân vật nam giả làm nữ',
  'Nhân Ngư': 'Nhân vật là người cá hoặc có yếu tố người cá',
  'Đông Phương': 'Bối cảnh phương Đông (Trung Quốc, Việt Nam...)',
  'Tây Phương': 'Bối cảnh phương Tây (Châu Âu, Mỹ...)',
  'Hàn Quốc': 'Bối cảnh Hàn Quốc',
  'Nhật Bản': 'Bối cảnh Nhật Bản',
  'Thái Lan': 'Bối cảnh Thái Lan',
  
  // ========== MORE CONTENT TYPES ==========
  'Hoan Hỉ Oan Gia': 'Hai người ghét nhau rồi yêu nhau',
  'Ngược Luyến Tình Thâm': 'Yêu nhau sâu đậm nhưng có nhiều đau khổ',
  'Tình Hữu Độc Chung': 'Tình yêu duy nhất, chung thủy một đời',
  'Cứu Rỗi': 'Nhân vật cứu rỗi nhau khỏi đau khổ, tổn thương',
  'Trục Thê': 'Thụ đuổi theo công, công lạnh nhạt ban đầu',
  'Cường Thủ Hào Đoạt': 'Dùng sức mạnh để cưỡng ép, chiếm đoạt',
  'Giam Cầm': 'Một bên bị giam giữ bởi bên kia',
  'Thân Trước Tình Sau': 'Có quan hệ thể xác trước rồi mới yêu',
  'Mất Trí Nhớ': 'Nhân vật bị mất trí nhớ',
  'Sống Lại': 'Nhân vật chết rồi sống lại',
  'Hắc Hóa': 'Nhân vật từ tốt chuyển sang xấu, đen tối',
  'Bạch Hóa': 'Nhân vật từ xấu chuyển sang tốt',
  'Song Hướng Yêu Thầm': 'Cả hai đều thầm thích nhau nhưng không dám nói',
  'Đơn Phương': 'Yêu đơn phương, một bên yêu một bên không',
  'Giấu Giếm': 'Giấu giếm thân phận hoặc tình cảm',
  'Hiểu Lầm': 'Có nhiều hiểu lầm giữa hai người',
  'Gương Vỡ Lại Lành': 'Chia tay rồi quay lại với nhau',
  'Vạn Nhân Mê': 'Nhân vật được rất nhiều người yêu thích',
  'Thiên Chi Kiêu Tử': 'Nhân vật được trời ban cho, tài năng xuất chúng'
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  let updated = 0;
  let skipped = 0;

  // Lấy tất cả tags trong dictionary
  const allTags = await TagDictionary.find({});
  console.log(`📊 Found ${allTags.length} tags in dictionary\n`);

  for (const tag of allTags) {
    const description = TAG_DESCRIPTIONS[tag.standardTag];
    
    if (description && tag.description !== description) {
      tag.description = description;
      await tag.save();
      console.log(`✅ Updated: ${tag.standardTag}`);
      updated++;
    } else if (!description) {
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Skipped (no description defined): ${skipped}`);
  console.log(`   - Total: ${allTags.length}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch(console.error);
