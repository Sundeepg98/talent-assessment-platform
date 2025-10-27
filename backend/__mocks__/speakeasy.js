module.exports = {
  generateSecret: jest.fn(() => ({
    base32: 'TESTSECRETBASE32',
    otpauth_url: 'otpauth://totp/Test:user@example.com?secret=TESTSECRETBASE32&issuer=Test',
    hex: 'testsecrethex',
    ascii: 'testsecretascii'
  })),
  totp: {
    verify: jest.fn(({ secret, token }) => token === '123456'),
    generate: jest.fn(() => '123456')
  },
  hotp: {
    verify: jest.fn(() => true),
    generate: jest.fn(() => '123456')
  }
};