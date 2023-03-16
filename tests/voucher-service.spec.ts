import voucherService, {
  VoucherApplyData,
} from "../src/services/voucherService";
import voucherRepository from "../src/repositories/voucherRepository";
import { Voucher } from "@prisma/client";
import { conflictError } from "../src/utils/errorUtils";

jest.mock("../src/repositories/voucherRepository");

describe("voucherService", () => {
  const mockGetVoucherByCode =
    voucherRepository.getVoucherByCode as jest.MockedFunction<
      typeof voucherRepository.getVoucherByCode
    >;
  const mockCreateVoucher =
    voucherRepository.createVoucher as jest.MockedFunction<
      typeof voucherRepository.createVoucher
    >;
  const mockUseVoucher = voucherRepository.useVoucher as jest.MockedFunction<
    typeof voucherRepository.useVoucher
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createVoucher", () => {
    it("should create a voucher with valid code and discount", async () => {
      const code = "ABC123";
      const discount = 20;

      mockGetVoucherByCode.mockResolvedValueOnce(null);

      await voucherService.createVoucher(code, discount);

      expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
      expect(mockCreateVoucher).toHaveBeenCalledWith(code, discount);
    });

    it("should throw a conflict error when trying to create a voucher with an existing code", async () => {
      const code = "ABC123";
      const discount = 20;
      const existingVoucher: Voucher = { id: 1, code, discount, used: false };

      mockGetVoucherByCode.mockResolvedValueOnce(existingVoucher);

      try {
        await voucherService.createVoucher(code, discount);
        fail("Expected exception to be thrown.");
      } catch (error) {
        console.log(error.message);
        expect(error.message).toEqual("Voucher already exist.");
      }

      expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
      expect(mockCreateVoucher).not.toHaveBeenCalled();
    });
  });

  describe("applyVoucher", () => {
    const validVoucher: Voucher = {
      id: 1,
      code: "ABC123",
      discount: 20,
      used: false,
    };

    it("should return the same amount if voucher code is not valid", async () => {
      const code = "DEF456";
      const amount = 50;

      await voucherService.createVoucher(code, 10);

      mockGetVoucherByCode.mockResolvedValueOnce({
        code,
        discount: 10,
        used: false,
      } as Voucher);

      const result = await voucherService.applyVoucher(code, amount);

      expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
      expect(mockUseVoucher).not.toHaveBeenCalled();
      expect(result).toEqual({
        amount,
        discount: 10,
        finalAmount: 50,
        applied: false,
      });
    });

    it("should return the same amount if voucher is already used", async () => {
      const code = "ABC123";
      const amount = 50;

      mockGetVoucherByCode.mockResolvedValueOnce({
        ...validVoucher,
        used: true,
      });

      const result = await voucherService.applyVoucher(code, amount);

      expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
      expect(mockUseVoucher).not.toHaveBeenCalled();
      expect(result).toEqual({
        amount,
        discount: 20,
        finalAmount: amount,
        applied: false,
      });
    }),
      it("should return the same amount if total amount is less than minimum for discount", async () => {
        const code = "ABC123";
        const amount = 50;

        mockGetVoucherByCode.mockResolvedValueOnce(validVoucher);

        const result = await voucherService.applyVoucher(code, amount);

        expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
        expect(result).toEqual({
          amount,
          discount: validVoucher.discount,
          finalAmount: amount,
          applied: false,
        });
        expect(mockUseVoucher).not.toHaveBeenCalled();
      }),
      it("should apply discount if total amount is valid and voucher was not used", async () => {
        const code = "ABC123";
        const amount = 150;
        const expectedDiscount = 20;
      
        mockGetVoucherByCode.mockResolvedValueOnce(validVoucher);
        mockUseVoucher.mockResolvedValueOnce(validVoucher as Voucher);
      
        const result = await voucherService.applyVoucher(code, amount);
      
        expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
        expect(mockUseVoucher).toHaveBeenCalledWith(code);
        expect(result).toEqual({
          amount,
          discount: validVoucher.discount,
          finalAmount: amount - amount * (expectedDiscount / 100),
          applied: true,
        });
      });

    it("should not apply discount if voucher was already used", async () => {
      const code = "ABC123";
      const amount = 150;

      mockGetVoucherByCode.mockResolvedValueOnce({
        ...validVoucher,
        used: true,
      });

      const result = await voucherService.applyVoucher(code, amount);

      expect(mockGetVoucherByCode).toHaveBeenCalledWith(code);
      expect(mockUseVoucher).not.toHaveBeenCalled();
      expect(result).toEqual({
        amount,
        discount: validVoucher.discount,
        finalAmount: amount,
        applied: false,
      });
    });
  });
});
