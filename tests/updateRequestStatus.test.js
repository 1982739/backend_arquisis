const { requestservices } = require("../src/utils/requestServices");

// Mock de los modelos Sequelize
jest.mock("../src/models", () => ({
  request: {
    update: jest.fn(),
    findOne: jest.fn(),
  },
  propertie: {},
  User: {}
}));

const { request } = require("../src/models");

describe("requestservices.updateRequestStatus", () => {
  
  test("debe actualizar el estado y retornar el request actualizado", async () => {
    // 1) Mock de actualización exitosa → 1 fila modificada
    request.update.mockResolvedValue([1]);

    // 2) Mock de la respuesta encontrada en findOne
    const fakeRequest = {
      id: 1,
      request_id: "A1",
      status: "approved",
      toJSON: () => ({
        id: 1,
        request_id: "A1",
        status: "approved"
      })
    };

    request.findOne.mockResolvedValue(fakeRequest);

    const result = await requestservices.updateRequestStatus("A1", "approved");

    // Validamos parámetros
    expect(request.update).toHaveBeenCalledWith(
      { status: "approved" },
      { where: { request_id: "A1" } }
    );

    // Validamos respuesta final
    expect(result).toEqual({
      id: 1,
      request_id: "A1",
      status: "approved"
    });
  });

  test("debe retornar error si el request no existe", async () => {
    // update retorna [0] → nada actualizado
    request.update.mockResolvedValue([0]);

    const result = await requestservices.updateRequestStatus("X999", "rejected");

    expect(result).toEqual({ error: "Request not found" });
  });

});
