module.exports = {
  PDFDocument: {
    create: jest.fn().mockResolvedValue({
      addPage: jest.fn().mockReturnValue({
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        drawText: jest.fn(),
        drawRectangle: jest.fn(),
        drawImage: jest.fn(),
        drawLine: jest.fn()
      }),
      embedFont: jest.fn().mockResolvedValue({ name: 'Helvetica' }),
      embedPng: jest.fn().mockResolvedValue({}),
      embedJpg: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
      getPages: jest.fn().mockReturnValue([]),
      getPageCount: jest.fn().mockReturnValue(1)
    }),
    load: jest.fn().mockResolvedValue({
      getPages: jest.fn().mockReturnValue([{
        getTextContent: jest.fn().mockResolvedValue('Sample PDF text content'),
        getSize: jest.fn().mockReturnValue({ width: 595, height: 842 })
      }]),
      getPageCount: jest.fn().mockReturnValue(1),
      save: jest.fn().mockResolvedValue(Buffer.from('modified-pdf'))
    })
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'HelveticaBold',
    TimesRoman: 'TimesRoman',
    TimesRomanBold: 'TimesRomanBold',
    Courier: 'Courier'
  },
  rgb: jest.fn((r, g, b) => ({ type: 'RGB', red: r, green: g, blue: b })),
  degrees: jest.fn((angle) => ({ type: 'degrees', angle }))
};