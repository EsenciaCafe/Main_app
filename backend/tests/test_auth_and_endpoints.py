"""Test suite for Esencia Café Loyalty App - Auth, Customer, and Admin endpoints"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
if not BASE_URL:
    pytest.fail("EXPO_PUBLIC_BACKEND_URL not set")
BASE_URL = BASE_URL.rstrip('/')

# Test data
CUSTOMER_EMAIL = "cliente@test.com"
CUSTOMER_PASSWORD = "test123"
ADMIN_EMAIL = "admin@esencia.com"
ADMIN_PASSWORD = "admin123"
TEST_NEW_USER_EMAIL = f"test_new_user_{os.urandom(4).hex()}@test.com"

# Storage for tokens and IDs
customer_token = None
admin_token = None
test_user_id = None
test_promotion_id = None


class TestAuth:
    """Authentication endpoint tests"""

    def test_01_login_customer_success(self, api_client):
        """Test customer login with valid credentials"""
        global customer_token
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == CUSTOMER_EMAIL
        assert data["user"]["role"] == "customer"
        assert "points" in data["user"]
        
        customer_token = data["token"]
        print(f"✓ Customer login successful. Points: {data['user']['points']}")

    def test_02_login_admin_success(self, api_client):
        """Test admin login with valid credentials"""
        global admin_token
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        
        admin_token = data["token"]
        print(f"✓ Admin login successful")

    def test_03_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid login rejected correctly")

    def test_04_register_new_user(self, api_client):
        """Test user registration and verify with GET"""
        global test_user_id
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_NEW_USER_EMAIL,
            "password": "test123",
            "name": "TEST_NewUser"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_NEW_USER_EMAIL
        assert data["user"]["role"] == "customer"
        assert data["user"]["points"] == 0  # New user starts with 0 points
        
        test_user_id = data["user"]["id"]
        test_token = data["token"]
        
        # Verify user can access /auth/me with token
        get_response = api_client.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {test_token}"
        })
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["email"] == TEST_NEW_USER_EMAIL
        assert get_data["id"] == test_user_id
        
        print(f"✓ New user registered and verified: {TEST_NEW_USER_EMAIL}")

    def test_05_register_duplicate_email(self, api_client):
        """Test registration with existing email returns 400"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": CUSTOMER_EMAIL,
            "password": "test123",
            "name": "Duplicate"
        })
        assert response.status_code == 400
        print("✓ Duplicate email registration rejected")

    def test_06_auth_me_with_token(self, api_client):
        """Test /auth/me endpoint with valid token"""
        if not customer_token:
            pytest.skip("Customer token not available")
        
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == CUSTOMER_EMAIL
        assert "points" in data
        print("✓ /auth/me working correctly")

    def test_07_auth_me_without_token(self, api_client):
        """Test /auth/me without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthorized access rejected")


class TestCustomerEndpoints:
    """Customer-facing endpoint tests"""

    def test_08_get_promotions_public(self, api_client):
        """Test GET /api/promotions (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/promotions")
        assert response.status_code == 200, f"Get promotions failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Promotions should be a list"
        assert len(data) >= 4, "Should have at least 4 seed promotions"
        
        # Verify promotion structure
        promo = data[0]
        assert "id" in promo
        assert "title" in promo
        assert "description" in promo
        assert "points_required" in promo
        assert "category" in promo
        assert "icon" in promo
        assert "is_active" in promo
        assert promo["is_active"] is True
        
        # Verify expected promotions exist
        titles = [p["title"] for p in data]
        assert "Café Gratis" in titles
        assert "Topping Gratis" in titles
        assert "Bebida Especial" in titles
        assert "Mini Pancakes Dobles" in titles
        
        print(f"✓ GET /api/promotions working. Found {len(data)} promotions")

    def test_09_get_history_authenticated(self, api_client):
        """Test GET /api/history with authentication"""
        if not customer_token:
            pytest.skip("Customer token not available")
        
        response = api_client.get(f"{BASE_URL}/api/history", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "History should be a list"
        # History may be empty for new user
        print(f"✓ GET /api/history working. Found {len(data)} history items")

    def test_10_get_my_redemptions(self, api_client):
        """Test GET /api/my-redemptions"""
        if not customer_token:
            pytest.skip("Customer token not available")
        
        response = api_client.get(f"{BASE_URL}/api/my-redemptions", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/my-redemptions working. Found {len(data)} redemptions")


class TestAdminEndpoints:
    """Admin endpoint tests"""

    def test_11_admin_get_stats(self, api_client):
        """Test GET /api/admin/stats"""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        
        data = response.json()
        assert "total_customers" in data
        assert "total_points_given" in data
        assert "total_redemptions" in data
        assert "pending_redemptions" in data
        assert "active_promos" in data
        
        assert isinstance(data["total_customers"], int)
        assert data["total_customers"] >= 1  # At least test customer
        assert data["active_promos"] >= 4  # At least 4 seed promos
        
        print(f"✓ Admin stats: {data['total_customers']} customers, {data['active_promos']} active promos")

    def test_12_admin_search_customers(self, api_client):
        """Test GET /api/admin/customers with search"""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        # Search for María (demo customer)
        response = api_client.get(f"{BASE_URL}/api/admin/customers?q=María", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1, "Should find at least María García"
        
        # Verify customer data structure
        customer = data[0]
        assert "id" in customer
        assert "email" in customer
        assert "name" in customer
        assert "points" in customer
        assert "role" in customer
        assert "password_hash" not in customer  # Should be excluded
        
        print(f"✓ Admin customer search working. Found {len(data)} customers")

    def test_13_admin_get_customer_by_id(self, api_client):
        """Test GET /api/admin/customer/{user_id}"""
        if not admin_token or not test_user_id:
            pytest.skip("Admin token or test user ID not available")
        
        response = api_client.get(f"{BASE_URL}/api/admin/customer/{test_user_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == test_user_id
        assert data["email"] == TEST_NEW_USER_EMAIL
        assert "password_hash" not in data
        
        print(f"✓ Admin get customer by ID working")

    def test_14_admin_add_points_and_verify(self, api_client):
        """Test POST /api/admin/points and verify with GET"""
        if not admin_token or not test_user_id:
            pytest.skip("Admin token or test user ID not available")
        
        # Get initial points
        get_initial = api_client.get(f"{BASE_URL}/api/admin/customer/{test_user_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        initial_points = get_initial.json()["points"]
        
        # Add points
        points_to_add = 5
        add_response = api_client.post(f"{BASE_URL}/api/admin/points", 
            json={
                "user_id": test_user_id,
                "points": points_to_add,
                "reason": "TEST_Café"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert add_response.status_code == 200, f"Add points failed: {add_response.text}"
        
        add_data = add_response.json()
        assert "message" in add_data
        assert "customer" in add_data
        assert add_data["customer"]["points"] == initial_points + points_to_add
        
        # Verify with GET
        get_verify = api_client.get(f"{BASE_URL}/api/admin/customer/{test_user_id}", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        verify_data = get_verify.json()
        assert verify_data["points"] == initial_points + points_to_add
        
        print(f"✓ Admin add points working. Points: {initial_points} -> {verify_data['points']}")

    def test_15_admin_create_promotion_and_verify(self, api_client):
        """Test POST /api/admin/promotions and verify with GET"""
        global test_promotion_id
        if not admin_token:
            pytest.skip("Admin token not available")
        
        # Create promotion
        new_promo = {
            "title": "TEST_Promo",
            "description": "Test promotion for automated testing",
            "points_required": 20,
            "category": "test",
            "icon": "star"
        }
        create_response = api_client.post(f"{BASE_URL}/api/admin/promotions",
            json=new_promo,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_response.status_code == 200, f"Create promotion failed: {create_response.text}"
        
        create_data = create_response.json()
        assert "id" in create_data
        assert create_data["title"] == new_promo["title"]
        assert create_data["points_required"] == new_promo["points_required"]
        assert create_data["is_active"] is True
        
        test_promotion_id = create_data["id"]
        
        # Verify promotion appears in public list
        get_response = api_client.get(f"{BASE_URL}/api/promotions")
        assert get_response.status_code == 200
        promos = get_response.json()
        promo_ids = [p["id"] for p in promos]
        assert test_promotion_id in promo_ids
        
        print(f"✓ Admin create promotion working. Created: {create_data['title']}")

    def test_16_admin_update_promotion_and_verify(self, api_client):
        """Test PUT /api/admin/promotions/{id} and verify with GET"""
        if not admin_token or not test_promotion_id:
            pytest.skip("Admin token or test promotion ID not available")
        
        update_data = {
            "title": "TEST_Promo_Updated",
            "points_required": 25
        }
        update_response = api_client.put(
            f"{BASE_URL}/api/admin/promotions/{test_promotion_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200, f"Update promotion failed: {update_response.text}"
        
        updated = update_response.json()
        assert updated["title"] == update_data["title"]
        assert updated["points_required"] == update_data["points_required"]
        assert updated["id"] == test_promotion_id
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/api/promotions")
        promos = get_response.json()
        test_promo = next((p for p in promos if p["id"] == test_promotion_id), None)
        assert test_promo is not None
        assert test_promo["title"] == update_data["title"]
        
        print(f"✓ Admin update promotion working")

    def test_17_admin_get_pending_redemptions(self, api_client):
        """Test GET /api/admin/pending-redemptions"""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = api_client.get(f"{BASE_URL}/api/admin/pending-redemptions", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin pending redemptions working. Found {len(data)} pending")

    def test_18_admin_get_activity(self, api_client):
        """Test GET /api/admin/activity"""
        if not admin_token:
            pytest.skip("Admin token not available")
        
        response = api_client.get(f"{BASE_URL}/api/admin/activity", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data
        assert "redemptions" in data
        assert isinstance(data["transactions"], list)
        assert isinstance(data["redemptions"], list)
        
        print(f"✓ Admin activity working. {len(data['transactions'])} transactions, {len(data['redemptions'])} redemptions")

    def test_19_admin_delete_promotion_and_verify(self, api_client):
        """Test DELETE /api/admin/promotions/{id} (soft delete) and verify"""
        if not admin_token or not test_promotion_id:
            pytest.skip("Admin token or test promotion ID not available")
        
        delete_response = api_client.delete(
            f"{BASE_URL}/api/admin/promotions/{test_promotion_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        
        # Verify promotion no longer in active list
        get_response = api_client.get(f"{BASE_URL}/api/promotions")
        promos = get_response.json()
        promo_ids = [p["id"] for p in promos]
        assert test_promotion_id not in promo_ids, "Deleted promotion should not appear in active list"
        
        print(f"✓ Admin delete promotion working (soft delete)")

    def test_20_customer_cannot_access_admin_endpoints(self, api_client):
        """Test that customer token cannot access admin endpoints"""
        if not customer_token:
            pytest.skip("Customer token not available")
        
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 403, "Customer should not access admin endpoints"
        print("✓ Admin access control working correctly")
