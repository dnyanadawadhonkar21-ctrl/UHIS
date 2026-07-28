const prisma = require('../config/prisma');

const getLabOrders = async (req, res, next) => {
  try {
    const labReports = await prisma.labReport.findMany({
      include: {
        patient: { include: { user: true } },
        laboratory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, labReports });
  } catch (error) {
    next(error);
  }
};

const createLabReportOrder = async (req, res, next) => {
  try {
    const { patientId, testName, testCategory } = req.body;

    const lab = await prisma.laboratory.findUnique({ where: { userId: req.user.id } });

    const report = await prisma.labReport.create({
      data: {
        laboratoryId: lab ? lab.id : null,
        patientId,
        testName,
        testCategory: testCategory || 'BLOOD',
        status: 'PENDING',
      },
      include: { patient: { include: { user: true } } },
    });

    res.status(201).json({ success: true, message: 'Lab report test order created.', report });
  } catch (error) {
    next(error);
  }
};

const updateLabReportResult = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, resultData, remarks, fileUrl } = req.body;

    const updated = await prisma.labReport.update({
      where: { id: reportId },
      data: {
        status: status || 'COMPLETED',
        resultData,
        remarks,
        fileUrl,
      },
      include: { patient: { include: { user: true } } },
    });

    // Automatically log in medical history timeline
    if (status === 'COMPLETED') {
      await prisma.medicalRecord.create({
        data: {
          patientId: updated.patientId,
          recordType: 'RADIOLOGY',
          title: `Diagnostic Report: ${updated.testName}`,
          description: remarks || resultData || 'Diagnostic laboratory report completed.',
          attachmentUrl: fileUrl,
        },
      });
    }

    res.status(200).json({ success: true, message: 'Lab report results updated.', report: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLabOrders,
  createLabReportOrder,
  updateLabReportResult,
};
