const { requestservices } = require("../src/utils/requestServices");

// Mock de Request y User en ../src/models/index.js
jest.mock("../src/models", () => ({
  request: {
    findOne: jest.fn(),
  },
  propertie: {}, // por si acaso
  User: {
    findByPk: jest.fn(),
  }
}));

const { request } = require("../src/models");

describe("requestServices.getRequestByRequestId", () => {
  test("debe retornar el request cuando existe", async () => {
    const fakeRequest = { id: 1, request_id: "123", toJSON: () => ({ id: 1, request_id: "123" }) };

    request.findOne.mockResolvedValue(fakeRequest);

    const res = await requestservices.getRequestByRequestId("123");

    expect(res).toEqual({ id: 1, request_id: "123" });
    expect(request.findOne).toHaveBeenCalledWith({ where: { request_id: "123" } });
  });

  test("debe retornar error si no existe", async () => {
    request.findOne.mockResolvedValue(null);

    const res = await requestservices.getRequestByRequestId("999");

    expect(res).toEqual({ error: "Request not found" });
  });
});
