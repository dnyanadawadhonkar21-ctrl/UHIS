const prisma = require('../config/prisma');

const getPrescriptionsQueue = async (req, res, next) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        items: true,
        dispenseRecords: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};

const getInventory = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, medicines });
  } catch (error) {
    next(error);
  }
};

const addMedicine = async (req, res, next) => {
  try {
    const { name, genericName, brand, category, unitPrice, stockQuantity, expiryDate } = req.body;

    const pharmacy = await prisma.pharmacy.findFirst();
    if (!pharmacy) return res.status(400).json({ success: false, message: 'Pharmacy profile not found.' });

    const medicine = await prisma.medicine.create({
      data: {
        pharmacyId: pharmacy.id,
        name,
        genericName,
        brand,
        category: category || 'ANALGESIC',
        unitPrice: parseFloat(unitPrice || 10),
        stockQuantity: parseInt(stockQuantity || 100),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({ success: true, message: 'Medicine added to inventory.', medicine });
  } catch (error) {
    next(error);
  }
};

const dispenseMedicine = async (req, res, next) => {
  try {
    const { prescriptionId, patientId, totalCost } = req.body;

    const pharmacy = await prisma.pharmacy.findFirst();

    const record = await prisma.dispenseRecord.create({
      data: {
        pharmacyId: pharmacy ? pharmacy.id : 'default-pharmacy',
        prescriptionId,
        patientId,
        status: 'DISPENSED',
        totalCost: parseFloat(totalCost || 250),
      },
      include: {
        patient: { include: { user: true } },
        prescription: { include: { items: true } },
      },
    });

    res.status(200).json({ success: true, message: 'Medicines dispensed & invoice generated.', record });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrescriptionsQueue,
  getInventory,
  addMedicine,
  dispenseMedicine,
};
